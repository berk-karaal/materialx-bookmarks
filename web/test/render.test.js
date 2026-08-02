import { describe, expect, it } from "vitest";

import { linkLabel } from "../src/render.js";

describe("linkLabel", () => {
  it("uses the given text", () => {
    expect(linkLabel({ text: "Docs", url: "https://docs.astral.sh/ruff/" })).toBe("Docs");
  });

  it("falls back to the hostname", () => {
    expect(linkLabel({ url: "https://github.com/astral-sh/ruff" })).toBe("github.com");
  });

  it("strips a leading www", () => {
    expect(linkLabel({ url: "https://www.rust-lang.org/learn" })).toBe("rust-lang.org");
  });

  it("keeps a subdomain that is not www", () => {
    expect(linkLabel({ url: "https://docs.astral.sh/uv/" })).toBe("docs.astral.sh");
  });

  it("falls back to the raw value when the url will not parse", () => {
    expect(linkLabel({ url: "/local/page" })).toBe("/local/page");
  });

  it("prefers text even when the url is unparseable", () => {
    expect(linkLabel({ text: "Local", url: "/local/page" })).toBe("Local");
  });
});
