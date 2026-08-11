import { describe, expect, it } from "vitest";

import { applyFilters, orderTags, tagCounts } from "../src/filter.js";

const ITEMS = [
  { title: "a", tags: ["python"] },
  { title: "b", tags: ["python", "ai"] },
  { title: "c", tags: ["rust"] },
  { title: "d" },
];

const passthrough = () => ITEMS;

function state(overrides = {}) {
  return { q: "", tags: [], sort: "default", page: 1, ...overrides };
}

describe("applyFilters", () => {
  it("keeps yaml order by default", () => {
    const result = applyFilters(ITEMS, state(), passthrough, 10);

    expect(result.visible.map((item) => item.title)).toEqual(["a", "b", "c", "d"]);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(1);
  });

  it("reverses the order", () => {
    const result = applyFilters(ITEMS, state({ sort: "reversed" }), passthrough, 10);

    expect(result.visible.map((item) => item.title)).toEqual(["d", "c", "b", "a"]);
  });

  it("filters tags with AND", () => {
    const result = applyFilters(ITEMS, state({ tags: ["python", "ai"] }), passthrough, 10);

    expect(result.visible.map((item) => item.title)).toEqual(["b"]);
    expect(result.total).toBe(1);
  });

  it("treats an untagged item as matching no tag filter", () => {
    const result = applyFilters(ITEMS, state({ tags: ["python"] }), passthrough, 10);

    expect(result.visible.map((item) => item.title)).toEqual(["a", "b"]);
  });

  it("paginates", () => {
    const first = applyFilters(ITEMS, state(), passthrough, 2);
    const second = applyFilters(ITEMS, state({ page: 2 }), passthrough, 2);

    expect(first.visible.map((item) => item.title)).toEqual(["a", "b"]);
    expect(second.visible.map((item) => item.title)).toEqual(["c", "d"]);
    expect(second.pageCount).toBe(2);
  });

  it("clamps a page beyond the end", () => {
    const result = applyFilters(ITEMS, state({ page: 99 }), passthrough, 2);

    expect(result.page).toBe(2);
    expect(result.visible.map((item) => item.title)).toEqual(["c", "d"]);
  });

  it("exposes the filtered set before pagination", () => {
    const result = applyFilters(ITEMS, state(), passthrough, 2);

    expect(result.filtered.map((item) => item.title)).toEqual(["a", "b", "c", "d"]);
  });

  it("applies search before tags", () => {
    const search = () => [ITEMS[1], ITEMS[2]];

    const result = applyFilters(ITEMS, state({ q: "x", tags: ["python"] }), search, 10);

    expect(result.visible.map((item) => item.title)).toEqual(["b"]);
  });

  it("reports an empty result set", () => {
    const result = applyFilters(ITEMS, state({ tags: ["nope"] }), passthrough, 10);

    expect(result.visible).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });
});

describe("tagCounts", () => {
  it("counts over the full collection in allowlist order", () => {
    const counts = tagCounts(ITEMS, ["python", "rust", "ai"]);

    expect([...counts.entries()]).toEqual([
      ["python", 2],
      ["rust", 1],
      ["ai", 1],
    ]);
  });

  it("reports zero for an unused tag", () => {
    expect(tagCounts(ITEMS, ["go"]).get("go")).toBe(0);
  });

  it("counts the intersection with the selected tags", () => {
    const view = applyFilters(ITEMS, state({ tags: ["python"] }), passthrough, 10);

    const counts = tagCounts(view.filtered, ["python", "rust", "ai"]);

    expect([...counts.entries()]).toEqual([
      ["python", 2],
      ["rust", 0],
      ["ai", 1],
    ]);
  });

  it("counts a selected tag as the whole result set", () => {
    const view = applyFilters(ITEMS, state({ tags: ["python", "ai"] }), passthrough, 10);

    const counts = tagCounts(view.filtered, ["python", "ai"]);

    expect(counts.get("python")).toBe(view.total);
    expect(counts.get("ai")).toBe(view.total);
  });

  it("narrows with the search query", () => {
    const search = () => [ITEMS[2]];

    const view = applyFilters(ITEMS, state({ q: "rip" }), search, 10);
    const counts = tagCounts(view.filtered, ["python", "rust", "ai"]);

    expect([...counts.entries()]).toEqual([
      ["python", 0],
      ["rust", 1],
      ["ai", 0],
    ]);
  });
});

describe("orderTags", () => {
  const TAGS = ["zeta", "alpha", "middle"];
  const counts = new Map([
    ["zeta", 1],
    ["alpha", 3],
    ["middle", 1],
  ]);

  it("keeps yaml order under manual", () => {
    expect(orderTags(TAGS, counts, "manual", "en")).toEqual(["zeta", "alpha", "middle"]);
  });

  it("falls back to yaml order for an unknown mode", () => {
    expect(orderTags(TAGS, counts, "nonsense", "en")).toEqual(["zeta", "alpha", "middle"]);
  });

  it("sorts alphabetically", () => {
    expect(orderTags(TAGS, counts, "alphabetical", "en")).toEqual(["alpha", "middle", "zeta"]);
  });

  it("sorts alphabetically under the site language", () => {
    expect(orderTags(["z", "ı", "i"], new Map(), "alphabetical", "tr")).toEqual(["ı", "i", "z"]);
  });

  it("sorts by count, descending", () => {
    expect(orderTags(TAGS, counts, "count", "en")).toEqual(["alpha", "zeta", "middle"]);
  });

  it("breaks a count tie with the yaml order", () => {
    const tied = new Map([
      ["zeta", 2],
      ["alpha", 2],
      ["middle", 2],
    ]);

    expect(orderTags(TAGS, tied, "count", "en")).toEqual(["zeta", "alpha", "middle"]);
  });

  it("treats a tag missing from the counts as zero", () => {
    expect(orderTags(TAGS, new Map([["middle", 5]]), "count", "en")).toEqual([
      "middle",
      "zeta",
      "alpha",
    ]);
  });

  it("does not mutate the input", () => {
    const tags = ["zeta", "alpha"];

    orderTags(tags, counts, "alphabetical", "en");

    expect(tags).toEqual(["zeta", "alpha"]);
  });
});
