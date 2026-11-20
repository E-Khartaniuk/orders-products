import { existsSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { prisma } from "../src/db.js";
import { productInput, registerUser, resetDatabase, type ApiClient } from "./helpers.js";

const app = createApp();
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

let api: ApiClient;

beforeEach(async () => {
  await resetDatabase();
  api = await registerUser(app);
});

async function createOrder(title = "Integration order") {
  const res = await api
    .post("/api/orders")
    .send({ title, location: { city: "Kyiv", latitude: 50.45, longitude: 30.52 } })
    .expect(201);
  return res.body as { id: number };
}

describe("orders and products against MySQL", () => {
  it("creates an order with a location and sums product prices per currency", async () => {
    const order = await createOrder();
    await api.post("/api/products").send(productInput(order.id)).expect(201);
    await api
      .post("/api/products")
      .send(
        productInput(order.id, {
          prices: [
            { symbol: "USD", value: 50.25 },
            { symbol: "UAH", value: 2085.38, isDefault: true },
          ],
        }),
      )
      .expect(201);

    const res = await api.get(`/api/orders/${order.id}`).expect(200);

    expect(res.body.location).toEqual({ city: "Kyiv", latitude: 50.45, longitude: 30.52 });
    expect(res.body.productsCount).toBe(2);
    expect(res.body.totals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "USD", value: 150.25 }),
        expect.objectContaining({ symbol: "UAH", value: 6235.38 }),
      ]),
    );
  });

  it("searches orders by title", async () => {
    await createOrder("Monitors for the office");
    await createOrder("Printers");

    const res = await api.get("/api/orders?search=Monitors").expect(200);

    expect(res.body.items.map((order: { title: string }) => order.title)).toEqual([
      "Monitors for the office",
    ]);
  });

  it("filters products by type, order and search and lists distinct types", async () => {
    const first = await createOrder();
    const second = await createOrder();
    await api.post("/api/products").send(productInput(first.id)).expect(201);
    await api
      .post("/api/products")
      .send(productInput(second.id, { type: "Laptops", title: "Lenovo ThinkPad T14" }))
      .expect(201);

    const byType = await api.get("/api/products?type=Laptops").expect(200);
    const byOrder = await api.get(`/api/products?orderId=${first.id}`).expect(200);
    const bySearch = await api.get("/api/products?search=ThinkPad").expect(200);
    const types = await api.get("/api/products/types").expect(200);

    expect(byType.body.items).toHaveLength(1);
    expect(byType.body.items[0].type).toBe("Laptops");
    expect(byOrder.body.items.map((p: { order: { id: number } }) => p.order.id)).toEqual([
      first.id,
    ]);
    expect(bySearch.body.items[0].title).toBe("Lenovo ThinkPad T14");
    expect(types.body.items).toEqual(expect.arrayContaining(["Laptops", "Monitors"]));
  });

  it("combines specification, status and condition filters and lists specifications by type", async () => {
    const order = await createOrder();
    const send = (overrides: Record<string, unknown>) =>
      api.post("/api/products").send(productInput(order.id, overrides)).expect(201);
    await send({ title: "A", specification: "24 inch", status: "IN_REPAIR", isNew: false });
    await send({ title: "B", specification: "24 inch", status: "FREE", isNew: false });
    await send({ title: "C", specification: "27 inch, 4K", status: "IN_REPAIR", isNew: true });
    await send({ title: "D", type: "Laptops", specification: "16 GB RAM" });

    const titles = async (query: string) =>
      (await api.get(`/api/products?${query}`).expect(200)).body.items
        .map((p: { title: string }) => p.title)
        .sort();

    expect(await titles("specification=24%20inch")).toEqual(["A", "B"]);
    expect(await titles("status=IN_REPAIR")).toEqual(["A", "C"]);
    expect(await titles("isNew=false")).toEqual(["A", "B"]);
    expect(await titles("type=Monitors&status=IN_REPAIR&isNew=true")).toEqual(["C"]);

    const monitors = await api.get("/api/products/specifications?type=Monitors").expect(200);
    const all = await api.get("/api/products/specifications").expect(200);
    expect(monitors.body.items).toEqual(["24 inch", "27 inch, 4K"]);
    expect(all.body.items).toEqual(["16 GB RAM", "24 inch", "27 inch, 4K"]);
  });

  it("rejects a duplicate serial number with 409 using the unique index", async () => {
    const order = await createOrder();
    const input = productInput(order.id);
    await api.post("/api/products").send(input).expect(201);

    await api.post("/api/products").send(input).expect(409);
    expect(await prisma.product.count()).toBe(1);
  });

  it("validates the guarantee period before touching the database", async () => {
    const order = await createOrder();

    const res = await api
      .post("/api/products")
      .send(productInput(order.id, { guaranteeStart: "2027-01-01", guaranteeEnd: "2026-01-01" }))
      .expect(400);

    expect(JSON.stringify(res.body)).toContain("guaranteeEnd");
    expect(await prisma.product.count()).toBe(0);
  });

  it("deletes an order with its products, prices and stored photos", async () => {
    const order = await createOrder();
    const product = await api.post("/api/products").send(productInput(order.id)).expect(201);
    const upload = await api
      .put(`/api/products/${product.body.id}/photo`)
      .attach("photo", PNG, { filename: "photo.png", contentType: "image/png" })
      .expect(200);
    const file = path.join(config.UPLOADS_DIR, upload.body.photo.replace(/^\/uploads\//, ""));
    expect(existsSync(file)).toBe(true);

    await api.delete(`/api/orders/${order.id}`).expect(204);

    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.price.count()).toBe(0);
    expect(existsSync(file)).toBe(false);
    await api.get(`/api/orders/${order.id}`).expect(404);
  });

  it("rejects a file that only pretends to be an image", async () => {
    const order = await createOrder();
    const product = await api.post("/api/products").send(productInput(order.id)).expect(201);

    await api
      .put(`/api/products/${product.body.id}/photo`)
      .attach("photo", Buffer.from("not an image"), {
        filename: "fake.png",
        contentType: "image/png",
      })
      .expect(415);

    const stored = await prisma.product.findUniqueOrThrow({ where: { id: product.body.id } });
    expect(stored.photo).toBeNull();
  });
});
