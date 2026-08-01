import { expect, test } from "@playwright/test";

async function navigateInstantly(page, from, linkSuffix, urlGlob) {
  await page.goto(from);
  await page.evaluate(() => {
    window.__probe = "alive";
  });

  await page.locator(`a[href$='${linkSuffix}']`).first().click();
  await page.waitForURL(urlGlob);

  await expect
    .poll(() => page.evaluate(() => window.__probe ?? "gone"))
    .toBe("alive");
}

test("renders under the materialx theme without console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto("/");

  await expect(page.locator(".mxb__item")).toHaveCount(6);
  await expect(page.locator(".mxb__count")).toHaveText("6 of 15 bookmarks");
  expect(errors).toEqual([]);
});

test("two components on one page keep separate state", async ({ page }) => {
  await page.goto("/multiple/");

  await page.locator(".mxb").first().locator(".mxb__chip[data-tag='rust']").click();

  await expect(page).toHaveURL(/rust-tools\.tags=rust/);
  await expect(page).not.toHaveURL(/specs\./);
  await expect(page.locator(".mxb").nth(1).locator(".mxb__item")).toHaveCount(8);
});

test("survives instant navigation from another bookmarks page", async ({ page }) => {
  await navigateInstantly(page, "/", "reading/", "**/reading/**");

  await expect(page.locator(".mxb__item")).toHaveCount(5);
});

test("survives instant navigation from a page without a component", async ({ page }) => {
  await navigateInstantly(page, "/about/", "tools/", "**/tools/**");

  await expect(page.locator(".mxb__item")).toHaveCount(6);
});
