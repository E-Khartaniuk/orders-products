import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { authedClient } from "./auth-helpers.js";
import { prismaMock, sampleProductRecord } from "./prisma-mock.js";

const { uploadsDir } = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "op-photos-"));
  process.env.UPLOADS_DIR = dir;
  return { uploadsDir: dir };
});

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { subscribe } = await import("../src/events/bus.js");
const app = createApp();
const api = await authedClient(app);

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const productsDir = () => readdirSync(path.join(uploadsDir, "products"));

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  rmSync(uploadsDir, { recursive: true, force: true });
});

describe("product photo", () => {
  it("stores the photo, returns the product and announces the update", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ photo: null });
    prismaMock.product.update.mockImplementation(async ({ data }) => ({
      ...sampleProductRecord,
      orderId: 1,
      ...data,
    }));
    const events: unknown[] = [];
    const unsubscribe = subscribe((event) => events.push(event));

    const res = await api.put("/api/products/10/photo").attach("photo", JPEG, "photo.jpg");
    unsubscribe();

    expect(res.status).toBe(200);
    expect(res.body.photo).toMatch(/^\/uploads\/products\/10-[\w-]+\.jpg$/);
    expect(productsDir()).toHaveLength(1);
    expect(events).toEqual([expect.objectContaining({ type: "product.updated", productId: 10 })]);
  });

  it("replaces the previous photo file", async () => {
    const [previous] = productsDir();
    prismaMock.product.findUnique.mockResolvedValue({ photo: `/uploads/products/${previous}` });
    prismaMock.product.update.mockImplementation(async ({ data }) => ({
      ...sampleProductRecord,
      ...data,
    }));

    await api.put("/api/products/10/photo").attach("photo", JPEG, "new.jpg");

    expect(productsDir()).toHaveLength(1);
    expect(productsDir()[0]).not.toBe(previous);
  });

  it("removes the photo and its file", async () => {
    const [current] = productsDir();
    prismaMock.product.findUnique.mockResolvedValue({ photo: `/uploads/products/${current}` });
    prismaMock.product.update.mockResolvedValue({ ...sampleProductRecord, photo: null });

    const res = await api.delete("/api/products/10/photo");

    expect(res.status).toBe(200);
    expect(res.body.photo).toBeNull();
    expect(productsDir()).toHaveLength(0);
  });

  it("returns 404 for an unknown product", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const res = await api.put("/api/products/999/photo").attach("photo", JPEG, "photo.jpg");

    expect(res.status).toBe(404);
  });

  it("rejects non-image files", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ photo: null });

    const res = await api
      .put("/api/products/10/photo")
      .attach("photo", Buffer.from("not an image"), "photo.jpg");

    expect(res.status).toBe(415);
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });
});
