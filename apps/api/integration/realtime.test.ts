import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createSocketServer } from "../src/socket.js";
import { registerUser, resetDatabase, type ApiClient } from "./helpers.js";

const app = createApp();
const httpServer = createServer(app);
const sockets = createSocketServer(httpServer);
let url = "";
let api: ApiClient;
const clients: Socket[] = [];

beforeAll(async () => {
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  sockets.close();
  await new Promise((resolve) => httpServer.close(resolve));
});

beforeEach(async () => {
  await resetDatabase();
  api = await registerUser(app);
});

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

async function open() {
  const client = connect(url, { transports: ["websocket"], forceNew: true });
  clients.push(client);
  await new Promise<void>((resolve) => client.once("connect", () => resolve()));
  return client;
}

const nextValue = <T>(client: Socket, event: string, match: (value: T) => boolean) =>
  new Promise<T>((resolve) => {
    const handler = (value: T) => {
      if (!match(value)) return;
      client.off(event, handler);
      resolve(value);
    };
    client.on(event, handler);
  });

describe("realtime over Socket.io", () => {
  it("broadcasts the number of open tabs", async () => {
    const first = await open();
    const twoOpen = nextValue<number>(first, "sessions:count", (count) => count === 2);
    const second = await open();
    expect(await twoOpen).toBe(2);

    const oneLeft = nextValue<number>(first, "sessions:count", (count) => count === 1);
    second.close();
    expect(await oneLeft).toBe(1);
  });

  it("drops lost connections within ~15 s via the heartbeat", () => {
    const { pingInterval, pingTimeout } = sockets.io.engine.opts;
    expect((pingInterval ?? Infinity) + (pingTimeout ?? Infinity)).toBeLessThanOrEqual(15_000);
  });

  it("delivers domain events from REST writes only to authenticated sockets", async () => {
    const member = await open();
    const stranger = await open();
    expect(await member.emitWithAck("auth", api.token)).toBe(true);
    expect(await stranger.emitWithAck("auth", "not-a-token")).toBe(false);

    const received: unknown[] = [];
    stranger.on("domain:event", (event) => received.push(event));
    const created = nextValue<{ type: string; orderId: number }>(
      member,
      "domain:event",
      (event) => event.type === "order.created",
    );

    const order = await api.post("/api/orders").send({ title: "Realtime order" }).expect(201);

    expect(await created).toMatchObject({ type: "order.created", orderId: order.body.id });
    expect(received).toEqual([]);
  });
});
