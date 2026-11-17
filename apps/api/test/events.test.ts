import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { authedClient } from "./auth-helpers.js";
import { prismaMock, sampleProductRecord } from "./prisma-mock.js";

vi.mock("../src/db.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { createSocketServer } = await import("../src/socket.js");
const { publish, subscribe } = await import("../src/events/bus.js");
const { signAccessToken } = await import("../src/modules/auth/tokens.js");

const app = createApp();
const api = await authedClient(app);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("domain events from services", () => {
  it("publishes order.created after creating an order", async () => {
    prismaMock.order.create.mockResolvedValue({
      id: 7,
      title: "Order",
      description: null,
      date: new Date(),
      createdAt: new Date(),
      products: [],
    });
    const events: unknown[] = [];
    const unsubscribe = subscribe((event) => events.push(event));

    await api.post("/api/orders").send({ title: "Order" });
    unsubscribe();

    expect(events).toEqual([expect.objectContaining({ type: "order.created", orderId: 7 })]);
  });

  it("publishes product.deleted with the parent order id", async () => {
    prismaMock.product.delete.mockResolvedValue({ id: 10, orderId: 3 });
    const events: unknown[] = [];
    const unsubscribe = subscribe((event) => events.push(event));

    await api.delete("/api/products/10");
    unsubscribe();

    expect(events).toEqual([
      expect.objectContaining({ type: "product.deleted", productId: 10, orderId: 3 }),
    ]);
  });

  it("does not publish when the mutation fails", async () => {
    prismaMock.product.findUnique.mockResolvedValue(sampleProductRecord);
    prismaMock.order.findUnique.mockResolvedValue(null);
    const handler = vi.fn();
    const unsubscribe = subscribe(handler);

    await api.post("/api/products").send({});
    unsubscribe();

    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps notifying other handlers when one throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const good = vi.fn();
    const offBad = subscribe(() => {
      throw new Error("boom");
    });
    const offGood = subscribe(good);

    publish({ type: "order.deleted", orderId: 1 });
    offBad();
    offGood();
    spy.mockRestore();

    expect(good).toHaveBeenCalledOnce();
  });
});

describe("socket delivery", () => {
  const httpServer = createServer();
  const sockets = createSocketServer(httpServer);
  let url = "";
  const clients: Socket[] = [];

  const open = async () => {
    const client = connect(url, { transports: ["websocket"], forceNew: true });
    clients.push(client);
    await new Promise<void>((resolve) => client.on("connect", () => resolve()));
    return client;
  };

  const authenticate = (client: Socket, token: string) =>
    new Promise<boolean>((resolve) => client.emit("auth", token, resolve));

  beforeAll(async () => {
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    clients.forEach((client) => client.disconnect());
    await sockets.close();
  });

  it("delivers events only to authenticated sockets", async () => {
    const authed = await open();
    const anonymous = await open();
    const token = await signAccessToken({ userId: 1, email: "demo@inventory.local" });

    expect(await authenticate(authed, token)).toBe(true);
    expect(await authenticate(anonymous, "not-a-token")).toBe(false);

    const anonymousHandler = vi.fn();
    anonymous.on("domain:event", anonymousHandler);
    const received = new Promise((resolve) => authed.once("domain:event", resolve));

    publish({ type: "order.deleted", orderId: 42 });

    await expect(received).resolves.toMatchObject({ type: "order.deleted", orderId: 42 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(anonymousHandler).not.toHaveBeenCalled();
  });
});
