import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://127.0.0.1:8765" },
  webServer: {
    command:
      "uv run python scripts/build_fixture_site.py && uv run python -m http.server 8765 -d .e2e-site",
    url: "http://127.0.0.1:8765/index.html",
    reuseExistingServer: false,
  },
});
