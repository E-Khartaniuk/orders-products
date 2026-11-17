import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { authedClient } from "./auth-helpers.js";
import { prismaMock } from "./prisma-mock.js";

const { uploadsDir } = await vi.hoisted(async () => {
  const { mkdtempSync: makeTemp } = await import("node:fs");
  const { tmpdir: osTmp } = await import("node:os");
  const { join } = await import("node:path");
  const dir = makeTemp(join(osTmp(), "op-uploads-"));
  process.env.UPLOADS_DIR = dir;
  process.env.AVATAR_MAX_BYTES = "1024";
  return { uploadsDir: dir };
});

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const app = createApp();
const api = await authedClient(app);

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const user = { id: 1, email: "demo@inventory.local", name: "Demo", avatarUrl: null };

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  rmSync(uploadsDir, { recursive: true, force: true });
});

describe("PATCH /api/profile", () => {
  it("updates the name", async () => {
    prismaMock.user.update.mockResolvedValue({ ...user, name: "New Name" });

    const res = await api.patch("/api/profile").send({ name: "  New Name " });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("New Name");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "New Name" },
    });
  });

  it("rejects a too short name", async () => {
    const res = await api.patch("/api/profile").send({ name: "A" });
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).patch("/api/profile").send({ name: "Name" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/profile/avatar", () => {
  it("stores a PNG and serves it from /uploads", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.user.update.mockImplementation(async ({ data }) => ({ ...user, ...data }));

    const res = await api.put("/api/profile/avatar").attach("avatar", PNG, "me.png");

    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toMatch(/^\/uploads\/avatars\/1-[\w-]+\.png$/);
    expect(readdirSync(path.join(uploadsDir, "avatars"))).toHaveLength(1);

    const file = await request(app).get(res.body.user.avatarUrl);
    expect(file.status).toBe(200);
    expect(file.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("rejects files that are not images even with an image name", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const res = await api
      .put("/api/profile/avatar")
      .attach("avatar", Buffer.from("<script>alert(1)</script>"), "fake.png");

    expect(res.status).toBe(415);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects files above the size limit", async () => {
    const res = await api
      .put("/api/profile/avatar")
      .attach("avatar", Buffer.concat([PNG, Buffer.alloc(2048)]), "big.png");

    expect(res.status).toBe(413);
  });

  it("removes the avatar", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...user, avatarUrl: "/uploads/avatars/x.png" });
    prismaMock.user.update.mockResolvedValue(user);

    const res = await api.delete("/api/profile/avatar");

    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toBeNull();
  });
});

describe("PUT /api/auth/password", () => {
  it("changes the password and revokes other sessions", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: await bcrypt.hash("demo12345", 4),
    });

    const res = await api
      .put("/api/auth/password")
      .set("Cookie", "refresh_token=current-token")
      .send({ currentPassword: "demo12345", newPassword: "newPass123" });

    expect(res.status).toBe(204);
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(prismaMock.refreshSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 1, NOT: { tokenHash: expect.any(String) } },
    });
  });

  it("reports a wrong current password on its field", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: await bcrypt.hash("demo12345", 4),
    });

    const res = await api
      .put("/api/auth/password")
      .send({ currentPassword: "wrong", newPassword: "newPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("currentPassword");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
