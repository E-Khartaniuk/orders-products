import { expect, test, unique } from "./fixtures";

test("counts open tabs over WebSocket", async ({ page, context, user }) => {
  void user;
  await page.goto("/orders");
  const counter = page.locator(".top-menu__sessions-count");
  await expect(counter).toHaveText(/^\d+$/);
  const before = Number(await counter.textContent());

  const secondTab = await context.newPage();
  await secondTab.goto("/products");
  await expect(counter).toHaveText(String(before + 1));
  await expect(secondTab.locator(".top-menu__sessions-count")).toHaveText(String(before + 1));

  await secondTab.close();
  await expect(counter).toHaveText(String(before));
});

test("shows orders created and deleted elsewhere without a reload", async ({ page, api }) => {
  await page.goto("/orders");
  await expect(page.locator(".order-row").first()).toBeVisible();

  const order = await api.createOrder(unique("E2E realtime"));
  const row = page.locator(".order-row", { hasText: order.title });
  await expect(row).toBeVisible();

  await api.deleteOrder(order.id);
  await expect(row).toHaveCount(0);
});
