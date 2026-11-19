import { expect, test, unique } from "./fixtures";

test("filters products by type and remembers the filter after reload", async ({ page, api }) => {
  const order = await api.createOrder(unique("E2E filter order"));
  const type = `E2E-${Date.now().toString(36)}`;
  const title = unique("E2E filtered product");
  await api.createProduct(order.id, { type, title });

  await page.goto("/products");
  await page.locator("#product-type-filter").selectOption(type);

  const rows = page.locator(".product-row");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText(title);

  await page.reload();
  await expect(page.locator("#product-type-filter")).toHaveValue(type);
  await expect(rows).toHaveCount(1);

  await rows.getByRole("link", { name: order.title }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
  await expect(page.getByLabel("Детали прихода")).toContainText(title);
});
