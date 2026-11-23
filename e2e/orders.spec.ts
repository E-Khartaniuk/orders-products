import { expect, test, unique } from "./fixtures";

test("creates an order, adds and removes a product, then deletes the order", async ({
  page,
  user,
}) => {
  test.slow();
  void user;
  const orderTitle = unique("E2E order");
  const productTitle = unique("E2E monitor");

  await page.goto("/orders");
  await page.getByRole("button", { name: "Добавить приход" }).click();

  const orderDialog = page.getByRole("dialog", { name: "Новый приход" });
  await orderDialog.getByRole("button", { name: "Создать" }).click();
  await expect(orderDialog.getByText("Введите название прихода")).toBeVisible();

  await orderDialog.locator("#order-title").fill(orderTitle);
  await orderDialog.locator("#order-warehouse").selectOption({ index: 1 });
  await orderDialog.getByRole("button", { name: "Создать" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const details = page.getByLabel("Детали прихода");
  await expect(details).toContainText(orderTitle);
  await expect(details).toContainText("В этом приходе пока нет продуктов");

  await details.getByRole("button", { name: "Добавить продукт" }).click();
  const productDialog = page.getByRole("dialog", { name: `Новый продукт · ${orderTitle}` });
  await productDialog.locator("#product-title").fill(productTitle);
  await productDialog.locator("#product-serial").fill(`SN-E2E.${Date.now()}`);
  await productDialog.locator("#product-type").fill("Monitors");
  await productDialog.locator("#product-specification").fill("27 inch, 4K");
  await productDialog.locator("#product-guarantee-start").fill("2026-06-01");
  await productDialog.locator("#product-guarantee-end").fill("2026-01-01");
  await productDialog.locator("#product-price-usd").fill("250");
  await productDialog.locator("#product-price-uah").fill("10375.50");
  await productDialog.getByRole("button", { name: "Добавить" }).click();
  await expect(
    productDialog.getByText("Окончание гарантии не может быть раньше начала"),
  ).toBeVisible();

  await productDialog.locator("#product-guarantee-end").fill("2027-06-01");
  await productDialog.getByRole("button", { name: "Добавить" }).click();
  await expect(productDialog).toBeHidden();
  await expect(details).toContainText(productTitle);

  const orderRow = page.locator(".order-row", { hasText: orderTitle });
  await expect(orderRow.locator(".order-row__count-value")).toHaveText("1");

  // The product card shows every field and edits them in place.
  const editedTitle = `${productTitle} edited`;
  await details.getByRole("button", { name: `Открыть карточку продукта ${productTitle}` }).click();
  const card = page.getByRole("dialog", { name: productTitle });
  await expect(card).toContainText("27 inch, 4K");
  await expect(card).toContainText(orderTitle);
  await card.getByRole("button", { name: "Редактировать" }).click();

  const editDialog = page.getByRole("dialog", { name: "Редактирование продукта" });
  await expect(editDialog.locator("#product-edit-title")).toHaveValue(productTitle);
  await editDialog.locator("#product-edit-title").fill(editedTitle);
  await editDialog.locator("#product-edit-status").selectOption("IN_REPAIR");
  await editDialog.getByRole("button", { name: "Сохранить" }).click();

  const savedCard = page.getByRole("dialog", { name: editedTitle });
  await expect(savedCard).toContainText("В ремонте");
  await page.keyboard.press("Escape");
  await expect(savedCard).toBeHidden();
  await expect(details).toContainText(editedTitle);

  await details.getByRole("button", { name: `Удалить продукт ${editedTitle}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expect(details).not.toContainText(editedTitle);
  await expect(orderRow.locator(".order-row__count-value")).toHaveText("0");

  // The compact list next to open details hides row actions, as in the mockup.
  await details.getByRole("link", { name: "Закрыть" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await page.getByRole("button", { name: `Удалить приход ${orderTitle}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expect(orderRow).toHaveCount(0);
});

test("finds orders through the header search", async ({ page, api }) => {
  const order = await api.createOrder(unique("E2E searchable"));

  await page.goto("/orders");
  await page.getByRole("searchbox").fill(order.title);

  await expect(page.locator(".order-row")).toHaveCount(1);
  await expect(page.locator(".order-row")).toContainText(order.title);
});
