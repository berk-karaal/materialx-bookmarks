import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e-demo",
  use: { baseURL: "http://127.0.0.1:8803" },
  webServer: {
    command:
      "uv run --group demo mkdocs build -f demo/mkdocs.local.yml -d ../.demo-site-local && uv run python -m http.server 8803 -d .demo-site-local",
    cwd: import.meta.dirname,
    url: "http://127.0.0.1:8803/index.html",
    reuseExistingServer: false,
  },
});
