import { expect, test } from "./fixtures";

test("is installable: manifest is linked and the service worker activates", async ({ page }) => {
  await page.goto("/login");

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest).toMatchObject({ display: "standalone", start_url: expect.any(String) });
  expect(manifest.icons.length).toBeGreaterThan(0);

  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
});
