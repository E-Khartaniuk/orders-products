import { authedClient } from "./auth-helpers.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaError, prismaMock, sampleProductRecord } from "./prisma-mock.js";

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const app = createApp();
const api = await authedClient(app);

const orderRecord = {
  id: 1,
  title: "Order 1",
  description: null,
  date: new Date("2024-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-02T00:00:00.000Z"),
  products: [
    {
      prices: [
        { value: "100.50", symbol: "USD", isDefault: false },
        { value: "4170.75", symbol: "UAH", isDefault: true },
      ],
    },
    {
      prices: [
        { value: "20", symbol: "USD", isDefault: false },
        { value: "830", symbol: "UAH", isDefault: true },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/orders", () => {
  it("returns orders with products count and totals in both currencies", async () => {
    prismaMock.order.findMany.mockResolvedValue([orderRecord]);

    const res = await api.get("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      id: 1,
      title: "Order 1",
      productsCount: 2,
      totals: [
        { symbol: "USD", value: 120.5, isDefault: false },
        { symbol: "UAH", value: 5000.75, isDefault: true },
      ],
    });
  });

  it("filters by search term", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await api.get("/api/orders").query({ search: "monitor" });

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { title: { contains: "monitor" } } }),
    );
  });
});

describe("GET /api/orders/:id", () => {
  it("returns order with its products", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...orderRecord,
      products: [sampleProductRecord],
    });

    const res = await api.get("/api/orders/1");

    expect(res.status).toBe(200);
    expect(res.body.productsCount).toBe(1);
    expect(res.body.products[0]).toMatchObject({
      serialNumber: "SN-0000000001",
      guarantee: { start: "2024-01-01T00:00:00.000Z", end: "2026-01-01T00:00:00.000Z" },
      prices: [
        { symbol: "USD", value: 100.5 },
        { symbol: "UAH", value: 4170.75 },
      ],
    });
  });

  it("responds 404 for unknown order", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await api.get("/api/orders/999");

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/);
  });

  it("responds 400 for invalid id", async () => {
    const res = await api.get("/api/orders/abc");

    expect(res.status).toBe(400);
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders", () => {
  it("creates an order", async () => {
    prismaMock.order.create.mockResolvedValue({ ...orderRecord, products: [] });

    const res = await api.post("/api/orders").send({ title: "Order 1" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, productsCount: 0, totals: [] });
  });

  it("rejects empty title", async () => {
    const res = await api.post("/api/orders").send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("title");
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const res = await api
      .post("/api/orders")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/orders/:id", () => {
  it("rejects empty update", async () => {
    const res = await api.patch("/api/orders/1").send({});

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/orders/:id", () => {
  it("deletes an order", async () => {
    prismaMock.order.delete.mockResolvedValue(orderRecord);

    const res = await api.delete("/api/orders/1");

    expect(res.status).toBe(204);
    expect(prismaMock.order.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("responds 404 when order does not exist", async () => {
    prismaMock.order.delete.mockRejectedValue(prismaError("P2025"));

    const res = await api.delete("/api/orders/999");

    expect(res.status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("responds 404 with JSON error", async () => {
    const res = await api.get("/api/unknown");

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain("/api/unknown");
  });
});

describe("order location", () => {
  it("exposes location when coordinates are stored", async () => {
    prismaMock.order.findMany.mockResolvedValue([
      { ...orderRecord, city: "Kyiv", latitude: 50.45, longitude: 30.52, products: [] },
    ]);

    const res = await api.get("/api/orders");

    expect(res.body.items[0].location).toEqual({ city: "Kyiv", latitude: 50.45, longitude: 30.52 });
  });

  it("stores location columns on create", async () => {
    prismaMock.order.create.mockResolvedValue({ ...orderRecord, products: [] });

    const res = await api.post("/api/orders").send({
      title: "With location",
      location: { city: "Lviv", latitude: 49.84, longitude: 24.03 },
    });

    expect(res.status).toBe(201);
    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ city: "Lviv", latitude: 49.84, longitude: 24.03 }),
      }),
    );
  });

  it("rejects out-of-range coordinates", async () => {
    const res = await api.post("/api/orders").send({
      title: "Bad",
      location: { city: "Nowhere", latitude: 120, longitude: 0 },
    });

    expect(res.status).toBe(400);
  });
});
