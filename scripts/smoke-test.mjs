#!/usr/bin/env node
// End-to-end smoke test for a running stack (Docker or local).
// Usage: node scripts/smoke-test.mjs [--api http://localhost:4000] [--web http://localhost:3000]
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    api: { type: "string", default: process.env.SMOKE_API_URL ?? "http://localhost:4000" },
    web: { type: "string", default: process.env.SMOKE_WEB_URL ?? "http://localhost:3000" },
    email: { type: "string", default: process.env.DEMO_USER_EMAIL ?? "demo@inventory.local" },
    password: { type: "string", default: process.env.DEMO_USER_PASSWORD ?? "demo12345" },
  },
});

const results = [];

async function check(name, run) {
  try {
    const detail = await run();
    results.push({ name, ok: true, detail });
    console.log(`  ok    ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`  FAIL  ${name} — ${error instanceof Error ? error.message : error}`);
  }
}

async function request(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 200)}`);
  return text;
}

const json = async (url, init) => JSON.parse(await request(url, init));

console.log(`Smoke test: api=${values.api} web=${values.web}`);

let token = null;

await check("API health and database", async () => {
  const body = await json(`${values.api}/api/health`);
  if (body.db !== "up") throw new Error(JSON.stringify(body));
  return "db up";
});

await check("Sign in as demo user", async () => {
  const body = await json(`${values.api}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: values.email, password: values.password }),
  });
  token = body.accessToken;
  return body.user.email;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

await check("Orders list", async () => {
  const body = await json(`${values.api}/api/orders`, { headers: auth() });
  if (body.total < 1) throw new Error("no orders, run the seed");
  return `${body.total} orders`;
});

await check("Products list and types", async () => {
  const products = await json(`${values.api}/api/products`, { headers: auth() });
  const types = await json(`${values.api}/api/products/types`, { headers: auth() });
  if (products.total < 1) throw new Error("no products");
  return `${products.total} products, ${types.items.length} types`;
});

await check("GraphQL order details", async () => {
  const body = await json(`${values.api}/api/graphql`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ me { email } orders { id products { id } } }" }),
  });
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return `${body.data.orders.length} orders via GraphQL`;
});

await check("Protected endpoint rejects anonymous requests", async () => {
  const response = await fetch(`${values.api}/api/orders`);
  if (response.status !== 401) throw new Error(`expected 401, got ${response.status}`);
});

await check("Web app serves the sign-in page", async () => {
  const html = await request(`${values.web}/login`);
  if (!html.includes("Inventory")) throw new Error("unexpected page");
});

await check("Web app serves the PWA manifest", async () => {
  const manifest = await json(`${values.web}/manifest.webmanifest`);
  return manifest.short_name;
});

const failed = results.filter((result) => !result.ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
