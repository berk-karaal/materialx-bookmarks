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

## Releasing

Releases publish to PyPI through
[Trusted Publishing](https://docs.pypi.org/trusted-publishers/), so no API token is stored in this
repository. The publisher is configured on PyPI against this repository, the `release.yml`
workflow and the `pypi` environment.

1. Update `version` in `pyproject.toml`.
2. Move the `Unreleased` entries in `CHANGELOG.md` under the new version and add its link.
3. Merge that to `main` and wait for the `tests` workflow to pass.
4. Draft a GitHub release with tag `v<version>` and publish it.

Publishing the release runs `.github/workflows/release.yml`, which refuses to continue unless the
tag matches the version in `pyproject.toml`, then builds, runs `twine check`, installs the wheel
into a clean environment and builds the demo site against it before uploading.
