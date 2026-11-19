import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:4000";

export type TestUser = { email: string; password: string; name: string; token: string };

const suffix = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const unique = (label: string) => `${label} ${suffix()}`;

export async function registerUser(request: APIRequestContext): Promise<TestUser> {
  const user = { email: `e2e-${suffix()}@example.test`, password: "secret123", name: "E2E User" };
  const res = await request.post(`${API_URL}/api/auth/register`, { data: user });
  expect(res.status(), await res.text()).toBe(201);
  return { ...user, token: (await res.json()).accessToken };
}

export async function signIn(page: Page, user: Pick<TestUser, "email" | "password">) {
  await page.locator("#login-email").fill(user.email);
  await page.locator("#login-password").fill(user.password);
  await page.getByRole("button", { name: "Войти" }).click();
}

type Api = {
  createOrder: (title: string) => Promise<{ id: number; title: string }>;
  createProduct: (orderId: number, fields?: Record<string, unknown>) => Promise<{ id: number }>;
  deleteOrder: (id: number) => Promise<void>;
};

export const test = base.extend<{ user: TestUser; api: Api }>({
  // Registering through page.request stores the refresh cookie in the browser
  // context, so pages open already signed in with a session of their own.
  user: async ({ page }, use) => {
    await use(await registerUser(page.request));
  },

  api: async ({ user, playwright }, use) => {
    const request = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${user.token}` },
    });
    const createdOrders: number[] = [];

    const send = async (method: "post" | "delete", url: string, data?: unknown) => {
      const res = await request[method](url, { data });
      expect(res.ok(), await res.text()).toBe(true);
      return res.status() === 204 ? null : res.json();
    };

    await use({
      createOrder: async (title) => {
        const order = await send("post", "/api/orders", { title });
        createdOrders.push(order.id);
        return order;
      },
      createProduct: (orderId, fields = {}) =>
        send("post", "/api/products", {
          serialNumber: `E2E-${suffix()}`,
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
          ...fields,
        }),
      deleteOrder: async (id) => {
        await send("delete", `/api/orders/${id}`);
        createdOrders.splice(createdOrders.indexOf(id), 1);
      },
    });

    for (const id of createdOrders) await request.delete(`/api/orders/${id}`);
    await request.dispose();
  },
});

export { expect };
