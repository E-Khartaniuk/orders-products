import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "./prisma-mock.js";

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { hashToken } = await import("../src/modules/auth/tokens.js");
const app = createApp();

const password = "secret123";
const userRecord = {
  id: 1,
  email: "demo@inventory.local",
  name: "Demo User",
  avatarUrl: null,
  passwordHash: bcrypt.hashSync(password, 4),
  createdAt: new Date(),
};

const extractRefreshCookie = (res: request.Response) => {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  return cookies.find((cookie) => cookie.startsWith("refresh_token="));
};

const cookieValue = (cookie: string) => cookie.split(";")[0].split("=")[1];

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.refreshSession.create.mockResolvedValue({});
});

describe("POST /api/auth/login", () => {
  it("returns access token, user and sets httpOnly refresh cookie", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "Demo@Inventory.local ", password });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: 1,
      email: "demo@inventory.local",
      name: "Demo User",
      avatarUrl: null,
      locale: null,
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));

    const cookie = extractRefreshCookie(res);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/api/auth");
    expect(prismaMock.refreshSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });

  it("rejects wrong password with 401", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: userRecord.email, password: "wrong-pass1" });

    expect(res.status).toBe(401);
    expect(extractRefreshCookie(res)).toBeUndefined();
  });

  it("rejects unknown user with the same 401 message", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@inventory.local", password });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("validates email format", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nope", password });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user with hashed password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }) => ({
      ...userRecord,
      ...data,
      id: 2,
    }));

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@inventory.local", name: "New User", password: "password1" });

    expect(res.status).toBe(201);
    const { passwordHash } = prismaMock.user.create.mock.calls[0][0].data;
    expect(passwordHash).not.toBe("password1");
    expect(await bcrypt.compare("password1", passwordHash)).toBe(true);
  });

  it("responds 409 for taken email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: userRecord.email, name: "Demo", password: "password1" });

    expect(res.status).toBe(409);
  });

  it("requires password with letters and digits", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@inventory.local", name: "New User", password: "12345678" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  async function loginAndGetCookie() {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: userRecord.email, password });
    const cookie = extractRefreshCookie(res)!;
    const session = prismaMock.refreshSession.create.mock.calls.at(-1)![0].data;
    return { cookie, token: cookieValue(cookie), session };
  }

  it("rotates refresh token and returns new access token", async () => {
    const { token, session } = await loginAndGetCookie();
    prismaMock.refreshSession.findUnique.mockResolvedValue({ ...session, user: userRecord });
    prismaMock.refreshSession.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${token}`);

    const nextToken = cookieValue(extractRefreshCookie(res)!);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(nextToken).not.toBe(token);
    expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { id: session.id, tokenHash: hashToken(token) },
      data: expect.objectContaining({ tokenHash: hashToken(nextToken) }),
    });
  });

  it("revokes all sessions when a concurrent refresh already rotated the token", async () => {
    const { token, session } = await loginAndGetCookie();
    prismaMock.refreshSession.findUnique.mockResolvedValue({ ...session, user: userRecord });
    prismaMock.refreshSession.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${token}`);

    expect(res.status).toBe(401);
    expect(prismaMock.refreshSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
  });

  it("revokes all sessions when an old token is reused", async () => {
    const { token, session } = await loginAndGetCookie();
    prismaMock.refreshSession.findUnique.mockResolvedValue({
      ...session,
      tokenHash: hashToken("another-token"),
      user: userRecord,
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${token}`);

    expect(res.status).toBe(401);
    expect(prismaMock.refreshSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
  });

  it("responds 401 without cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("responds 401 for a forged token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refresh_token=not-a-jwt");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the refresh cookie", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(204);
    expect(extractRefreshCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe("protected routes", () => {
  it("rejects requests without access token", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  it("rejects malformed access token", async () => {
    const res = await request(app).get("/api/orders").set("Authorization", "Bearer abc");
    expect(res.status).toBe(401);
  });

  it("returns current user for /api/auth/me", async () => {
    const login = await (async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRecord);
      return request(app).post("/api/auth/login").send({ email: userRecord.email, password });
    })();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userRecord.email);
  });
});
