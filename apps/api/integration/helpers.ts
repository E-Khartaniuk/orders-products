import type { Express } from "express";
import request from "supertest";
import { prisma } from "../src/db.js";

export async function resetDatabase() {
  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.order.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
}

let userCounter = 0;

export async function registerUser(app: Express) {
  userCounter += 1;
  const credentials = {
    email: `user${userCounter}-${Date.now()}@example.test`,
    password: "secret123",
    name: `Test User ${userCounter}`,
  };
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send(credentials).expect(201);
  const token: string = res.body.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  return {
    credentials,
    agent,
    token,
    user: res.body.user as { id: number; email: string },
    get: (url: string) => request(app).get(url).set(auth),
    post: (url: string) => request(app).post(url).set(auth),
    patch: (url: string) => request(app).patch(url).set(auth),
    put: (url: string) => request(app).put(url).set(auth),
    delete: (url: string) => request(app).delete(url).set(auth),
  };
}

export type ApiClient = Awaited<ReturnType<typeof registerUser>>;

let serialCounter = 0;

export function productInput(orderId: number, overrides: Record<string, unknown> = {}) {
  serialCounter += 1;
  return {
    serialNumber: `IT-${Date.now()}-${serialCounter}`,
    title: "Dell UltraSharp U2723QE",
    type: "Monitors",
    specification: "27 inch, 4K",
    guaranteeStart: "2026-01-01",
    guaranteeEnd: "2027-01-01",
    orderId,
    prices: [
      { symbol: "USD", value: 100 },
      { symbol: "UAH", value: 4150, isDefault: true },
    ],
    ...overrides,
  };
}
