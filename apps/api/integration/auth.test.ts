import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { registerUser, resetDatabase } from "./helpers.js";

const app = createApp();

const refreshCookie = (res: request.Response) => {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  return cookies.find((cookie) => cookie.startsWith("refresh_token="));
};

beforeEach(resetDatabase);

describe("auth against MySQL", () => {
  it("registers a user with a hashed password and an httpOnly refresh cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.test", password: "secret123", name: "New User" })
      .expect(201);

    expect(res.body.user).toMatchObject({ email: "new@example.test", name: "New User" });
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(res)).toMatch(/HttpOnly/i);
    expect(refreshCookie(res)).toMatch(/Path=\/api\/auth/);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "new@example.test" } });
    expect(stored.passwordHash).not.toContain("secret123");
    expect(await prisma.refreshSession.count({ where: { userId: stored.id } })).toBe(1);
  });

  it("rejects a duplicate email with 409", async () => {
    const { credentials } = await registerUser(app);
    await request(app).post("/api/auth/register").send(credentials).expect(409);
  });

  it("signs in with valid credentials and rejects a wrong password", async () => {
    const { credentials } = await registerUser(app);

    await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-pass1" })
      .expect(401);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.user.email).toBe(credentials.email);
  });

  it("rotates the refresh token and revokes all sessions when an old one is reused", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "rotate@example.test", password: "secret123", name: "Rotate" })
      .expect(201);
    const first = refreshCookie(res)!.split(";")[0];

    const rotated = await request(app).post("/api/auth/refresh").set("Cookie", first).expect(200);
    const second = refreshCookie(rotated)!.split(";")[0];
    expect(second).not.toBe(first);

    await request(app).post("/api/auth/refresh").set("Cookie", first).expect(401);
    await request(app).post("/api/auth/refresh").set("Cookie", second).expect(401);
    expect(await prisma.refreshSession.count()).toBe(0);
  });

  it("logs out by deleting the session behind the refresh cookie", async () => {
    const { agent } = await registerUser(app);

    await agent.post("/api/auth/refresh").expect(200);
    await agent.post("/api/auth/logout").expect(204);
    await agent.post("/api/auth/refresh").expect(401);
  });

  it("changes the password and keeps only the current session", async () => {
    const client = await registerUser(app);
    await request(app).post("/api/auth/login").send(client.credentials).expect(200);
    expect(await prisma.refreshSession.count({ where: { userId: client.user.id } })).toBe(2);

    await client.agent
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${client.token}`)
      .send({ currentPassword: client.credentials.password, newPassword: "changed456" })
      .expect(204);

    expect(await prisma.refreshSession.count({ where: { userId: client.user.id } })).toBe(1);
    await request(app)
      .post("/api/auth/login")
      .send({ email: client.credentials.email, password: "changed456" })
      .expect(200);
  });
});
