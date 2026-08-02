# Contributing

## Prerequisites

- Python 3.10 or newer, through [uv](https://docs.astral.sh/uv/)
- Node 22, for the browser bundle and the end-to-end suites
- A Chromium for Playwright: `npx playwright install chromium`

## Layout

```
src/materialx_bookmarks/   the plugin: plugin.py holds the MkDocs hooks, everything
                           else (config, fence, loader, models, locales) is plain
                           functions the hooks call
src/materialx_bookmarks/assets/   the built bundle — generated, but committed
web/src/                   the browser source that builds into it
tests/                     pytest, plus two Playwright suites
demo/                      a real mkdocs-materialx site using the plugin
```

There are two separate npm projects, each with its own lockfile: `web/` builds the bundle, and the
repository root holds only the Playwright harness. Both pin the public registry in `.npmrc`; if you
work behind a company mirror, leave those files alone so the lockfiles stay reproducible in CI.

## Checks

Each command below is one CI job in `.github/workflows/tests.yml`, so a green local run means a
green pull request.

| | |
|---|---|
| `uv run pytest` | The plugin: build-time behaviour, end to end through a real `mkdocs build` |
| `uv run ruff check .` and `uv run ruff format --check .` | Lint and formatting. `uv run ruff format .` fixes the second |
| `cd web && npm install && npm test` | The browser logic — filtering, counts, search, URL state |
| `cd web && npm run build` | Rebuilds the bundle. **Commit its output** |
| `npm ci && npm run test:e2e` | The component in a browser, against a minimal fixture site |
| `npm run test:demo` | The component under the real theme |

CI runs all of these on every push to `main` and every pull request, and additionally builds the
package, runs `twine check`, and installs the wheel into a clean environment to build the demo.

### Which suite for which change

- Build-time behaviour — validation, emitted JSON, injected markup: `tests/` with pytest.
- Browser logic that is a pure function: `web/test/`, which runs without a DOM.
- Anything touching the DOM: a Playwright suite, since vitest has no jsdom here.
- `tests/e2e/` uses a small fixture site built by `scripts/build_fixture_site.py` on the plain
  `mkdocs` theme, so it is fast and independent of the theme.
- `tests/e2e-demo/` uses the real mkdocs-materialx build. Put theme-interaction tests here —
  instant navigation, CSS bleeding in from the theme.

To watch a browser test run: `npx playwright test --headed`, or `--ui` for the interactive runner.

### The bundle

`npm run build` writes into `src/materialx_bookmarks/assets/`, and that output is committed —
building a wheel must never require Node. CI rebuilds it and fails if it differs from what you
committed, so run the build and include the result in the same commit as your `web/src` change.

## The demo site

`demo/` is a real mkdocs-materialx site using the plugin, published to GitHub Pages from `main` by
`.github/workflows/demo.yml`.

```bash
uv sync --group demo
uv run --group demo mkdocs serve -f demo/mkdocs.yml
```

`npm run test:demo` builds `demo/mkdocs.local.yml` — the same site with `site_url` pointed at the
test server — and runs `tests/e2e-demo/` against it. That override matters: the theme's
`navigation.instant` only intercepts links matching `site_url`, so without it the tests would
silently exercise ordinary page loads and miss instant-navigation regressions.

## Adding a language

Copy `src/materialx_bookmarks/locales/en.yml` to `src/materialx_bookmarks/locales/<code>.yml` and
translate the values. Nothing else needs to change: the plugin discovers locale files at runtime and
resolves strings at build time.

Keep `{shown}` and `{total}` intact in `result_count`. A key you leave out falls back to English and
logs a build warning.

Run `uv run pytest tests/test_locales.py` — one test asserts every locale carries every key.

## Changelog

Anything a user would notice goes under `Unreleased` in `CHANGELOG.md` as part of the same change.
Releasing only moves those entries; it does not write them.

## Releasing

Releases publish to PyPI through
[Trusted Publishing](https://docs.pypi.org/trusted-publishers/), so no API token is stored in this
repository. The publisher is configured on PyPI against this repository, the `release.yml`
workflow and the `pypi` environment.

1. Update `version` in `pyproject.toml`.
2. Move the `Unreleased` entries in `CHANGELOG.md` under the new version, and update the comparison
   links at the bottom of the file.
3. Merge that to `main` and wait for the `tests` workflow to pass.
4. Draft a GitHub release with tag `v<version>` and publish it.

Publishing the release runs `.github/workflows/release.yml`, which refuses to continue unless the
tag matches the version in `pyproject.toml`, then builds, runs `twine check`, installs the wheel
into a clean environment and builds the demo site against it before uploading.

A version on PyPI can never be replaced, so verify afterwards rather than trusting the green run:

```bash
uv venv /tmp/check
VIRTUAL_ENV=/tmp/check uv pip install --no-cache "materialx-bookmarks==<version>" mkdocs-materialx
/tmp/check/bin/mkdocs build -f demo/mkdocs.yml -d /tmp/check-site --strict
```
