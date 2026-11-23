import { authedClient } from "./auth-helpers.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaError, prismaMock, sampleProductRecord } from "./prisma-mock.js";

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const app = createApp();
const api = await authedClient(app);

const validProduct = {
  serialNumber: "SN-0000000001",
  title: "Gigabyte X58-USB3 (Socket 1366)",
  type: "Motherboards",
  specification: "Socket 1366",
  guaranteeStart: "2024-01-01",
  guaranteeEnd: "2026-01-01",
  orderId: 1,
  prices: [
    { symbol: "USD", value: 100.5 },
    { symbol: "UAH", value: 4170.75, isDefault: true },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/products", () => {
  it("returns products with order title and prices", async () => {
    prismaMock.product.findMany.mockResolvedValue([sampleProductRecord]);

    const res = await api.get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.items[0]).toMatchObject({
      title: "Gigabyte X58-USB3 (Socket 1366)",
      type: "Motherboards",
      order: { id: 1, title: "Order 1" },
    });
  });

  it("filters by type", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await api.get("/api/products").query({ type: "Monitors" });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "Monitors" }) }),
    );
  });

  it("filters by specification, status and condition", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await api
      .get("/api/products")
      .query({ specification: "27 inch", status: "IN_REPAIR", isNew: "false" });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specification: "27 inch",
          status: "IN_REPAIR",
          isNew: false,
        }),
      }),
    );
  });

  it("rejects an unknown status or condition", async () => {
    expect((await api.get("/api/products").query({ status: "BROKEN" })).status).toBe(400);
    expect((await api.get("/api/products").query({ isNew: "maybe" })).status).toBe(400);
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/products/types", () => {
  it("returns distinct product types", async () => {
    prismaMock.product.findMany.mockResolvedValue([{ type: "Laptops" }, { type: "Monitors" }]);

    const res = await api.get("/api/products/types");

    expect(res.body.items).toEqual(["Laptops", "Monitors"]);
  });
});

describe("GET /api/products/specifications", () => {
  it("returns distinct specifications of the selected type", async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { specification: "24 inch" },
      { specification: "27 inch" },
    ]);

    const res = await api.get("/api/products/specifications").query({ type: "Monitors" });

    expect(res.body.items).toEqual(["24 inch", "27 inch"]);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: "Monitors" }, distinct: ["specification"] }),
    );
  });
});

describe("POST /api/products", () => {
  it("creates a product", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.product.create.mockResolvedValue(sampleProductRecord);

    const res = await api.post("/api/products").send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.serialNumber).toBe("SN-0000000001");
  });

  it("rejects guarantee end before start", async () => {
    const res = await api
      .post("/api/products")
      .send({ ...validProduct, guaranteeEnd: "2023-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("guaranteeEnd");
  });

  it("rejects duplicate currencies", async () => {
    const res = await api.post("/api/products").send({
      ...validProduct,
      prices: [
        { symbol: "USD", value: 1 },
        { symbol: "USD", value: 2 },
      ],
    });

    expect(res.status).toBe(400);
  });

  it("responds 422 when order does not exist", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await api.post("/api/products").send(validProduct);

    expect(res.status).toBe(422);
    expect(prismaMock.product.create).not.toHaveBeenCalled();
  });

  it("responds 409 on duplicate serial number", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.product.create.mockRejectedValue(prismaError("P2002"));

    const res = await api.post("/api/products").send(validProduct);

    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/products/:id", () => {
  const { orderId: _orderId, ...validUpdate } = validProduct;

  it("updates fields and replaces prices", async () => {
    prismaMock.product.update.mockResolvedValue(sampleProductRecord);

    const res = await api.patch("/api/products/10").send({ ...validUpdate, status: "IN_REPAIR" });

    expect(res.status).toBe(200);
    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({
          status: "IN_REPAIR",
          prices: { deleteMany: {}, create: expect.arrayContaining([expect.anything()]) },
        }),
      }),
    );
  });

  it("does not let the order be changed", async () => {
    prismaMock.product.update.mockResolvedValue(sampleProductRecord);

    await api.patch("/api/products/10").send({ ...validUpdate, orderId: 99 });

    const { data } = prismaMock.product.update.mock.calls[0][0];
    expect(data).not.toHaveProperty("orderId");
  });

  it("rejects guarantee end before start", async () => {
    const res = await api
      .patch("/api/products/10")
      .send({ ...validUpdate, guaranteeEnd: "2023-01-01" });

    expect(res.status).toBe(400);
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it("responds 404 for a missing product", async () => {
    prismaMock.product.update.mockRejectedValue(prismaError("P2025"));

    expect((await api.patch("/api/products/999").send(validUpdate)).status).toBe(404);
  });

  it("responds 409 on duplicate serial number", async () => {
    prismaMock.product.update.mockRejectedValue(prismaError("P2002"));

    expect((await api.patch("/api/products/10").send(validUpdate)).status).toBe(409);
  });
});

describe("DELETE /api/products/:id", () => {
  it("deletes a product", async () => {
    prismaMock.product.delete.mockResolvedValue(sampleProductRecord);

    const res = await api.delete("/api/products/10");

    expect(res.status).toBe(204);
  });
});
