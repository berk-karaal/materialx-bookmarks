# Contributing

## Development

```bash
uv sync
uv run pytest

cd web
npm install
npm test
npm run build

cd ..
npm ci
npx playwright install chromium
npm run test:e2e
```

CI runs these suites on every push to `main` and every pull request
(`.github/workflows/tests.yml`). The `web` job also rebuilds the bundle and fails if it differs
from the committed one, so remember to commit `npm run build` output alongside `web/src` changes.

## The demo site

`demo/` is a real mkdocs-materialx site using the plugin. It is published to GitHub Pages from
`main` by `.github/workflows/demo.yml`.

```bash
uv sync --group demo
uv run --group demo mkdocs serve -f demo/mkdocs.yml
```

`npm run test:demo` builds `demo/mkdocs.local.yml` — the same site with `site_url` pointed at the
test server — and runs `tests/e2e-demo/` against it. That override matters: the theme's
`navigation.instant` only intercepts links matching `site_url`, so without it the tests would
silently exercise ordinary page loads and miss instant-navigation regressions.

`npm run build` writes the bundle into `src/materialx_bookmarks/assets/`. Commit that output —
building a wheel must never require Node.

## Adding a language

Copy `src/materialx_bookmarks/locales/en.yml` to `src/materialx_bookmarks/locales/<code>.yml` and
translate the values. Nothing else needs to change: the plugin discovers locale files at runtime and
resolves strings at build time.

Keep `{shown}` and `{total}` intact in `result_count`. A key you leave out falls back to English and
logs a build warning.

Run `uv run pytest tests/test_locales.py` — one test asserts every locale carries every key.
