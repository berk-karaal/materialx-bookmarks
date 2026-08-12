import { describe, expect, it } from "vitest";

import { countLabel, linkLabel } from "../src/render.js";

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

const LABELS = {
  result_count: "{shown} of {total} projects",
  result_count_one: "{shown} of {total} project",
};

describe("countLabel", () => {
  it("uses the plural template", () => {
    expect(countLabel(LABELS, 3, 12)).toBe("3 of 12 projects");
  });

  it("uses the singular template when the total is one", () => {
    expect(countLabel(LABELS, 1, 1)).toBe("1 of 1 project");
  });

  it("uses the plural template when nothing matched", () => {
    expect(countLabel(LABELS, 0, 0)).toBe("0 of 0 projects");
  });
});
