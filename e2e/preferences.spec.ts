import { expect, signIn, test } from "./fixtures";

test("switches the language and restores it for the same user on another device", async ({
  page,
  user,
  browser,
}) => {
  await page.goto("/orders");
  await page
    .getByRole("group", { name: "Язык интерфейса" })
    .getByRole("button", { name: "EN" })
    .click();

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /^Orders/ })).toBeVisible();
  await expect(page).toHaveTitle(/Orders/);

  const otherDevice = await browser.newContext({ locale: "ru-RU" });
  const otherPage = await otherDevice.newPage();
  await otherPage.goto("/login");
  await signIn(otherPage, user);
  await expect(otherPage.getByRole("heading", { level: 1, name: /^Orders/ })).toBeVisible();
  await otherDevice.close();
});
