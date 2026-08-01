import { expect, test } from "@playwright/test";

test("search, filter, sort, and paginate a collection", async ({ page }) => {
  await page.goto("/index.html");

  const items = page.locator(".mxb__item");
  await expect(items).toHaveCount(2);
  await expect(page.locator(".mxb__count")).toHaveText("2 of 5 bookmarks");

  await page.locator(".mxb__page--number[data-page='2']").click();
  await expect(items.first().locator(".mxb__title")).toHaveText("ripgrep");
  await expect(page).toHaveURL(/reading\.page=2/);

  await page.locator(".mxb__chip[data-tag='python']").click();
  await expect(items).toHaveCount(2);
  await expect(items.first().locator(".mxb__title")).toHaveText("Ruff");
  await expect(page).toHaveURL(/reading\.tags=python/);
  await expect(page).not.toHaveURL(/reading\.page=2/);

  await page.locator(".mxb__chip[data-tag='']").click();
  await page.locator(".mxb__search").fill("ripgrap");
  await expect(items).toHaveCount(1);
  await expect(items.first().locator(".mxb__title")).toHaveText("ripgrep");
  await expect(page).toHaveURL(/reading\.q=ripgrap/);

  await page.locator(".mxb__search").fill("");
  await page.locator(".mxb__sort").click();
  await expect(items.first().locator(".mxb__title")).toHaveText("Plain note");
  await expect(page.locator(".mxb__sort")).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/reading\.sort=reversed/);

  await page.locator(".mxb__sort").click();
  await expect(items.first().locator(".mxb__title")).toHaveText("Ruff");
  await expect(page.locator(".mxb__sort")).toHaveAttribute("aria-pressed", "false");
  await expect(page).not.toHaveURL(/reading\.sort=/);

  await page.locator(".mxb__search").fill("zzzzzzzz");
  await expect(page.locator(".mxb__empty")).toBeVisible();
});

test("a bookmark without a url renders as plain text", async ({ page }) => {
  await page.goto("/index.html?reading.sort=reversed");

  const first = page.locator(".mxb__item").first();

  await expect(first.locator(".mxb__title")).toHaveText("Plain note");
  await expect(first.locator("a")).toHaveCount(0);
});

test("state is restored from the url and scoped per instance", async ({ page }) => {
  await page.goto("/guides/deep/index.html?deep.tags=rust");

  await expect(page.locator(".mxb__item")).toHaveCount(1);
  await expect(page.locator(".mxb__item .mxb__title")).toHaveText("ripgrep");
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toHaveAttribute("aria-pressed", "true");
});
