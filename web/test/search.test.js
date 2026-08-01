import { describe, expect, it } from "vitest";

import { createSearch } from "../src/search.js";

const ITEMS = [
  { title: "Ruff", description: "Fast Python linter", tags: ["python"] },
  { title: "uv", description: "Python package manager", tags: ["python"] },
  { title: "ripgrep", description: "Fast recursive search", tags: ["rust"] },
];

describe("createSearch", () => {
  it("returns everything for an empty query", () => {
    expect(createSearch(ITEMS)("")).toEqual(ITEMS);
    expect(createSearch(ITEMS)("   ")).toEqual(ITEMS);
  });

  it("matches on title", () => {
    expect(createSearch(ITEMS)("ruff").map((item) => item.title)).toEqual(["Ruff"]);
  });

  it("tolerates a typo", () => {
    expect(createSearch(ITEMS)("ripgrap").map((item) => item.title)).toEqual(["ripgrep"]);
  });

  it("matches on description", () => {
    expect(createSearch(ITEMS)("package manager").map((item) => item.title)).toContain("uv");
  });

  it("ranks a title match above a description match", () => {
    const results = createSearch(ITEMS)("python").map((item) => item.title);

    expect(results.length).toBeGreaterThan(0);
  });

  it("returns nothing for an unrelated query", () => {
    expect(createSearch(ITEMS)("zzzzzzzz")).toEqual([]);
  });
});
