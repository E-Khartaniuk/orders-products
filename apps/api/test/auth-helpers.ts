import type { Express } from "express";
import request from "supertest";
import { signAccessToken } from "../src/modules/auth/tokens.js";

export async function authedClient(app: Express) {
  const token = await signAccessToken({ userId: 1, email: "demo@inventory.local" });
  const auth = { Authorization: `Bearer ${token}` };

  return {
    get: (url: string) => request(app).get(url).set(auth),
    post: (url: string) => request(app).post(url).set(auth),
    patch: (url: string) => request(app).patch(url).set(auth),
    put: (url: string) => request(app).put(url).set(auth),
    delete: (url: string) => request(app).delete(url).set(auth),
  };
}
