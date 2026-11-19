import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaError, prismaMock, sampleProductRecord } from "./prisma-mock.js";

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { signAccessToken } = await import("../src/modules/auth/tokens.js");
const app = createApp();
const token = await signAccessToken({ userId: 1, email: "demo@inventory.local" });

const gql = (query: string, variables?: Record<string, unknown>, auth = true) => {
  const req = request(app)
    .post("/api/graphql")
    .set("Content-Type", "application/json")
    .send({ query, variables });
  return auth ? req.set("Authorization", `Bearer ${token}`) : req;
};

const orderRecord = (id: number) => ({
  id,
  title: `Order ${id}`,
  description: null,
  date: new Date("2024-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-02T00:00:00.000Z"),
  products: [{ prices: [{ value: "10", symbol: "USD", isDefault: false }] }],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GraphQL auth", () => {
  it("responds 401 with UNAUTHENTICATED without token", async () => {
    const res = await gql("{ productTypes }", undefined, false);

    expect(res.status).toBe(401);
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  it("returns the current user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "demo@inventory.local",
      name: "Demo",
      avatarUrl: null,
    });

    const res = await gql("{ me { id email name } }");

    expect(res.body.data.me).toEqual({ id: "1", email: "demo@inventory.local", name: "Demo" });
  });
});

describe("Query.orders", () => {
  it("returns orders with totals and ISO dates", async () => {
    prismaMock.order.findMany.mockResolvedValue([orderRecord(1)]);

    const res = await gql(`{ orders { id title date productsCount totals { symbol value } } }`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toEqual([
      {
        id: "1",
        title: "Order 1",
        date: "2024-01-01T00:00:00.000Z",
        productsCount: 1,
        totals: [{ symbol: "USD", value: 10 }],
      },
    ]);
  });

  it("batches nested products of many orders into one query", async () => {
    prismaMock.order.findMany.mockResolvedValue([orderRecord(1), orderRecord(2)]);
    prismaMock.product.findMany.mockResolvedValue([
      sampleProductRecord,
      { ...sampleProductRecord, id: 11, order: { id: 2, title: "Order 2" } },
    ]);

    const res = await gql(`{ orders { id products { id serialNumber } } }`);

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: { in: [1, 2] } } }),
    );
    expect(res.body.data.orders.map((o: { products: unknown[] }) => o.products.length)).toEqual([
      1, 1,
    ]);
  });
});

describe("Query.order", () => {
  it("returns order with products and guarantee", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...orderRecord(1),
      products: [sampleProductRecord],
    });

    const res = await gql(
      `query Order($id: ID!) { order(id: $id) { id products { title status guarantee { start end } prices { symbol value } } } }`,
      { id: "1" },
    );

    expect(res.body.data.order.products[0]).toEqual({
      title: sampleProductRecord.title,
      status: "FREE",
      guarantee: { start: "2024-01-01T00:00:00.000Z", end: "2026-01-01T00:00:00.000Z" },
      prices: [
        { symbol: "USD", value: 100.5 },
        { symbol: "UAH", value: 4170.75 },
      ],
    });
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
  });

  it("returns null for unknown order", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await gql(`{ order(id: "999") { id } }`);

    expect(res.body.data.order).toBeNull();
    expect(res.body.errors).toBeUndefined();
  });

  it("rejects invalid id with BAD_USER_INPUT", async () => {
    const res = await gql(`{ order(id: "abc") { id } }`);

    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});

describe("Query.products", () => {
  it("passes filters to the service", async () => {
    prismaMock.product.findMany.mockResolvedValue([sampleProductRecord]);

    const res = await gql(`{ products(type: "Motherboards") { id order { title } } }`);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "Motherboards" }) }),
    );
    expect(res.body.data.products[0].order.title).toBe("Order 1");
  });
});

describe("Mutations", () => {
  it("creates an order", async () => {
    prismaMock.order.create.mockResolvedValue({ ...orderRecord(5), products: [] });

    const res = await gql(
      `mutation Create($input: CreateOrderInput!) { createOrder(input: $input) { id productsCount } }`,
      { input: { title: "New order", date: "2024-05-01T00:00:00.000Z" } },
    );

    expect(res.body.data.createOrder).toEqual({ id: "5", productsCount: 0 });
  });

  it("returns validation details for invalid product", async () => {
    const res = await gql(
      `mutation Create($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
      {
        input: {
          orderId: "1",
          serialNumber: "SN-1",
          title: "Monitor",
          type: "Monitors",
          specification: "24",
          guaranteeStart: "2025-01-01T00:00:00.000Z",
          guaranteeEnd: "2024-01-01T00:00:00.000Z",
          prices: [{ symbol: "USD", value: 10 }],
        },
      },
    );

    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
    expect(res.body.errors[0].extensions.details[0].path).toBe("guaranteeEnd");
  });

  it("maps missing record on delete to NOT_FOUND", async () => {
    prismaMock.order.delete.mockRejectedValue(prismaError("P2025"));

    const res = await gql(`mutation { deleteOrder(id: "999") }`);

    expect(res.body.errors[0].extensions.code).toBe("NOT_FOUND");
  });

  it("deletes a product", async () => {
    prismaMock.product.delete.mockResolvedValue(sampleProductRecord);

    const res = await gql(`mutation { deleteProduct(id: "10") }`);

    expect(res.body.data.deleteProduct).toBe(true);
  });
});

describe("error masking", () => {
  it("hides internal error details", async () => {
    prismaMock.order.findMany.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1:3306"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await gql(`{ orders { id } }`);

    expect(res.body.errors[0].message).toBe("Internal server error");
    expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
    spy.mockRestore();
  });
});
