import { describe, expect, it } from "vitest";

import { DEFAULT_STATE, parsePageSize, readState, writeState } from "../src/state.js";

describe("readState", () => {
  it("returns defaults for an empty query", () => {
    expect(readState("reading", "")).toEqual(DEFAULT_STATE);
  });

  it("reads namespaced parameters", () => {
    const state = readState(
      "reading",
      "?reading.q=ruff&reading.tags=python,ai&reading.sort=reversed&reading.page=3",
    );

    expect(state).toEqual({
      q: "ruff",
      tags: ["python", "ai"],
      sort: "reversed",
      page: 3,
      size: 20,
    });
  });

  it("ignores another instance's parameters", () => {
    expect(readState("tools", "?reading.q=ruff")).toEqual(DEFAULT_STATE);
  });

  it("falls back on unusable values", () => {
    const state = readState("reading", "?reading.page=0&reading.sort=sideways&reading.tags=");

    expect(state).toEqual({ q: "", tags: [], sort: "default", page: 1, size: 20 });
  });
});

describe("writeState", () => {
  it("omits defaults", () => {
    expect(writeState("reading", DEFAULT_STATE, "")).toBe("");
  });

  it("writes non-default values", () => {
    const state = { q: "ruff", tags: ["python", "ai"], sort: "reversed", page: 2, size: 20 };

    expect(writeState("reading", state, "")).toBe(
      "?reading.q=ruff&reading.tags=python%2Cai&reading.sort=reversed&reading.page=2",
    );
  });

  it("keeps other instances and unrelated parameters", () => {
    const result = writeState("tools", { ...DEFAULT_STATE, q: "rg" }, "?reading.q=ruff&x=1");

    expect(result).toContain("reading.q=ruff");
    expect(result).toContain("x=1");
    expect(result).toContain("tools.q=rg");
  });

  it("round-trips", () => {
    const state = { q: "a b", tags: ["ai"], sort: "reversed", page: 4, size: 20 };

    expect(readState("reading", writeState("reading", state, ""))).toEqual(state);
  });
});

describe("page size", () => {
  it("falls back to the collection's own per_page", () => {
    expect(readState("reading", "", 6).size).toBe(6);
  });

  it("reads a size from the query", () => {
    expect(readState("reading", "?reading.size=50", 6).size).toBe(50);
  });

  it("reads all", () => {
    expect(readState("reading", "?reading.size=all", 6).size).toBe("all");
  });

  it("falls back on an unusable size", () => {
    expect(readState("reading", "?reading.size=-3", 6).size).toBe(6);
    expect(readState("reading", "?reading.size=lots", 6).size).toBe(6);
  });

  it("omits the size when it matches per_page", () => {
    expect(writeState("reading", { ...DEFAULT_STATE, size: 6 }, "", 6)).toBe("");
  });

  it("writes a chosen size", () => {
    expect(writeState("reading", { ...DEFAULT_STATE, size: "all" }, "", 6)).toBe(
      "?reading.size=all",
    );
  });

  it("round-trips a size against a non-default per_page", () => {
    const state = { ...DEFAULT_STATE, size: 50 };

    expect(readState("reading", writeState("reading", state, "", 6), 6)).toEqual(state);
  });
});

describe("parsePageSize", () => {
  it("keeps all as a string", () => {
    expect(parsePageSize("all", 10)).toBe("all");
  });

  it("parses a number", () => {
    expect(parsePageSize("25", 10)).toBe(25);
  });

  it("falls back on anything else", () => {
    expect(parsePageSize(null, 10)).toBe(10);
    expect(parsePageSize("0", 10)).toBe(10);
  });
});
