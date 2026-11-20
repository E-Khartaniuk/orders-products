import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { webProxy } from "../src/lib/web-proxy.js";

let upstream: Server;
let target: string;

beforeAll(async () => {
  upstream = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.writeHead(200, { "content-type": "text/plain", "set-cookie": ["a=1", "b=2"] });
      res.end(`${req.method} ${req.url} ${req.headers["x-forwarded-proto"]} ${body}`);
    });
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  target = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => upstream.close(() => resolve())));

function appWithProxy(proxyTarget = target) {
  const app = express();
  app.use(webProxy(proxyTarget));
  app.get("/api/health", (_req, res) => res.json({ own: true }));
  app.get("/uploads/a.png", (_req, res) => res.send("file"));
  return app;
}

describe("webProxy", () => {
  it("forwards web routes with query, body and all response headers", async () => {
    const res = await request(appWithProxy()).post("/orders/1?tab=info").send("hello");

    expect(res.status).toBe(200);
    expect(res.text).toBe("POST /orders/1?tab=info http hello");
    expect(res.headers["set-cookie"]).toEqual(["a=1", "b=2"]);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("leaves API and upload routes to the API", async () => {
    const app = appWithProxy();

    expect((await request(app).get("/api/health")).body).toEqual({ own: true });
    expect((await request(app).get("/uploads/a.png")).text).toBe("file");
  });

  it("answers 502 when the web server is down", async () => {
    const res = await request(appWithProxy("http://127.0.0.1:1")).get("/orders");

    expect(res.status).toBe(502);
  });
});
