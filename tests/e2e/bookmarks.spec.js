import { expect, test } from "@playwright/test";

test("search, filter, sort, and paginate a collection", async ({ page }) => {
  await page.goto("/index.html");

  const items = page.locator(".mxb__item");
  await expect(items).toHaveCount(2);
  await expect(page.locator(".mxb__count")).toHaveText("2 of 6 bookmarks");

  await page.locator(".mxb__page--number[data-page='2']").click();
  await expect(items.first().locator(".mxb__title")).toHaveText("ripgrep");
  await expect(page).toHaveURL(/reading\.page=2/);

  await page.locator(".mxb__chip[data-tag='python']").click();
  await expect(items).toHaveCount(2);
  await expect(items.first().locator(".mxb__title")).toHaveText("Ruff");
  await expect(page).toHaveURL(/reading\.tags=python/);
  await expect(page).not.toHaveURL(/reading\.page=2/);

  await expect(page.locator(".mxb__chip[data-tag='python']")).toHaveText("python (3)");
  await expect(page.locator(".mxb__chip[data-tag='ai']")).toHaveText("ai (1)");
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toBeHidden();

  await page.locator(".mxb__chip[data-tag='']").click();
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toBeVisible();
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toHaveText("rust (1)");
  await page.locator(".mxb__search").fill("ripgrap");
  await expect(items).toHaveCount(1);
  await expect(items.first().locator(".mxb__title")).toHaveText("ripgrep");
  await expect(page).toHaveURL(/reading\.q=ripgrap/);
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toHaveText("rust (1)");
  await expect(page.locator(".mxb__chip[data-tag='python']")).toBeHidden();

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

test("links render as buttons and the title is plain text", async ({ page }) => {
  await page.goto("/index.html");

  const ruff = page.locator(".mxb__item").first();
  const links = ruff.locator(".mxb__link");

  await expect(ruff.locator(".mxb__title")).toHaveText("Ruff");
  await expect(ruff.locator(".mxb__title a")).toHaveCount(0);

  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveText("Docs");
  await expect(links.first()).toHaveAttribute("href", "https://astral.sh/ruff");
  await expect(links.first()).toHaveAttribute("title", "https://astral.sh/ruff");
  await expect(links.first()).toHaveAttribute("target", "_blank");

  await expect(links.nth(1)).toHaveText("github.com");
  await expect(links.nth(1)).toHaveAttribute(
    "title",
    "https://github.com/astral-sh/ruff/releases",
  );
});

test("a bookmark without links renders as plain text", async ({ page }) => {
  await page.goto("/index.html?reading.sort=reversed");

  const first = page.locator(".mxb__item").first();

  await expect(first.locator(".mxb__title")).toHaveText("Plain note");
  await expect(first.locator(".mxb__links")).toHaveCount(0);
  await expect(first.locator("a")).toHaveCount(0);
});

test("state is restored from the url and scoped per instance", async ({ page }) => {
  await page.goto("/guides/deep/index.html?deep.tags=rust");

  await expect(page.locator(".mxb__item")).toHaveCount(1);
  await expect(page.locator(".mxb__item .mxb__title")).toHaveText("ripgrep");
  await expect(page.locator(".mxb__chip[data-tag='rust']")).toHaveAttribute("aria-pressed", "true");
});
