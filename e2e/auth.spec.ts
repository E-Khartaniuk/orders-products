import { expect, registerUser, signIn, test } from "./fixtures";

test("sends anonymous users to sign-in and returns them to the requested page", async ({
  page,
  playwright,
}) => {
  const request = await playwright.request.newContext();
  const user = await registerUser(request);
  await request.dispose();

  await page.goto("/products");
  await expect(page).toHaveURL(/\/login\?next=%2Fproducts$/);

  await signIn(page, { email: user.email, password: "wrong-pass1" });
  await expect(page.getByText("Неверный email или пароль")).toBeVisible();

  await signIn(page, user);
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Продукты/ })).toBeVisible();
});

test("validates registration, keeps the session after reload and logs out", async ({ page }) => {
  await page.goto("/register");
  const submit = page.getByRole("button", { name: "Создать аккаунт" });

  await submit.click();
  await expect(page.getByText("Введите email")).toBeVisible();

  await page.locator("#register-name").fill("E2E Register");
  await page.locator("#register-email").fill(`e2e-reg-${Date.now()}@example.test`);
  await page.locator("#register-password").fill("secret123");
  await page.locator("#register-confirm").fill("secret124");
  await submit.click();
  await expect(page.getByText("Пароли не совпадают")).toBeVisible();

  await page.locator("#register-confirm").fill("secret123");
  await submit.click();
  await expect(page).toHaveURL(/\/orders$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /^Приходы/ })).toBeVisible();

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Forders$/);
});
