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

test("narrows products by specification, status and condition", async ({ page, api }) => {
  const order = await api.createOrder(unique("E2E filters order"));
  const type = `E2E-${Date.now().toString(36)}`;
  const specA = unique("Spec A");
  const specB = unique("Spec B");
  const repaired = unique("E2E used in repair");
  await api.createProduct(order.id, {
    type,
    title: repaired,
    specification: specA,
    status: "IN_REPAIR",
    isNew: false,
  });
  await api.createProduct(order.id, { type, specification: specA, status: "FREE", isNew: true });
  await api.createProduct(order.id, { type, specification: specB, status: "IN_REPAIR" });

  await page.goto("/products");
  const rows = page.locator(".product-row");
  const typeFilter = page.locator("#product-type-filter");
  const specFilter = page.locator("#product-specification-filter");
  const statusFilter = page.locator("#product-status-filter");
  const conditionFilter = page.locator("#product-condition-filter");

  await typeFilter.selectOption(type);
  await expect(rows).toHaveCount(3);
  await expect(specFilter.locator("option")).toHaveText(["Все спецификации", specA, specB]);

  await specFilter.selectOption(specA);
  await expect(rows).toHaveCount(2);
  await statusFilter.selectOption("IN_REPAIR");
  await expect(rows).toHaveCount(1);
  await conditionFilter.selectOption("used");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText(repaired);

  await conditionFilter.selectOption("new");
  await expect(page.getByText("Нет продуктов, подходящих под фильтр")).toBeVisible();

  await page.reload();
  await expect(specFilter).toHaveValue(specA);
  await expect(statusFilter).toHaveValue("IN_REPAIR");
  await expect(conditionFilter).toHaveValue("new");

  await typeFilter.selectOption("");
  await expect(specFilter).toHaveValue("");
});
