import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { registerUser, resetDatabase, type ApiClient } from "./helpers.js";

const app = createApp();
let api: ApiClient;

const gql = async (query: string, variables?: Record<string, unknown>) => {
  const res = await api.post("/api/graphql").send({ query, variables }).expect(200);
  expect(res.body.errors).toBeUndefined();
  return res.body.data;
};

beforeEach(async () => {
  await resetDatabase();
  api = await registerUser(app);
});

describe("GraphQL against MySQL", () => {
  it("creates an order and a product through mutations and reads them back", async () => {
    const { createOrder } = await gql(
      `mutation ($input: CreateOrderInput!) { createOrder(input: $input) { id title } }`,
      {
        input: {
          title: "GraphQL order",
          location: { city: "Lviv", latitude: 49.84, longitude: 24.03 },
        },
      },
    );

    await gql(`mutation ($input: CreateProductInput!) { createProduct(input: $input) { id } }`, {
      input: {
        serialNumber: "GQL-1",
        title: "HP LaserJet Pro M404dn",
        type: "Printers",
        specification: "Mono laser",
        guaranteeStart: "2026-01-01T00:00:00.000Z",
        guaranteeEnd: "2027-01-01T00:00:00.000Z",
        orderId: createOrder.id,
        prices: [
          { symbol: "USD", value: 300 },
          { symbol: "UAH", value: 12450, isDefault: true },
        ],
      },
    });

    const { order } = await gql(
      `query ($id: ID!) {
        order(id: $id) {
          title
          location { city }
          productsCount
          totals { symbol value }
          products { serialNumber order { title } prices { symbol value } }
        }
      }`,
      { id: createOrder.id },
    );

    expect(order).toMatchObject({
      title: "GraphQL order",
      location: { city: "Lviv" },
      productsCount: 1,
      products: [{ serialNumber: "GQL-1", order: { title: "GraphQL order" } }],
    });
    expect(order.totals).toEqual(
      expect.arrayContaining([
        { symbol: "USD", value: 300 },
        { symbol: "UAH", value: 12450 },
      ]),
    );
  });

  it("returns the same orders as REST", async () => {
    await api.post("/api/orders").send({ title: "First" }).expect(201);
    await api.post("/api/orders").send({ title: "Second" }).expect(201);

    const rest = await api.get("/api/orders").expect(200);
    const { orders } = await gql("{ orders { id title productsCount } }");

    expect(orders.map((order: { title: string }) => order.title)).toEqual(
      rest.body.items.map((order: { title: string }) => order.title),
    );
  });

  it("deletes an order through a mutation", async () => {
    const created = await api.post("/api/orders").send({ title: "To delete" }).expect(201);

    const { deleteOrder } = await gql(`mutation ($id: ID!) { deleteOrder(id: $id) }`, {
      id: created.body.id,
    });

    expect(deleteOrder).toBe(true);
    await api.get(`/api/orders/${created.body.id}`).expect(404);
  });

  it("rejects anonymous queries", async () => {
    const res = await request(app).post("/api/graphql").send({ query: "{ orders { id } }" });
    expect(res.status).toBe(401);
  });
});
