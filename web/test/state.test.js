import { describe, expect, it } from "vitest";

import { DEFAULT_STATE, readState, writeState } from "../src/state.js";

describe("readState", () => {
  it("returns defaults for an empty query", () => {
    expect(readState("reading", "")).toEqual(DEFAULT_STATE);
  });

  it("reads namespaced parameters", () => {
    const state = readState(
      "reading",
      "?reading.q=ruff&reading.tags=python,ai&reading.sort=reversed&reading.page=3",
    );

    expect(state).toEqual({ q: "ruff", tags: ["python", "ai"], sort: "reversed", page: 3 });
  });

  it("ignores another instance's parameters", () => {
    expect(readState("tools", "?reading.q=ruff")).toEqual(DEFAULT_STATE);
  });

  it("falls back on unusable values", () => {
    const state = readState("reading", "?reading.page=0&reading.sort=sideways&reading.tags=");

    expect(state).toEqual({ q: "", tags: [], sort: "default", page: 1 });
  });
});

describe("writeState", () => {
  it("omits defaults", () => {
    expect(writeState("reading", DEFAULT_STATE, "")).toBe("");
  });

  it("writes non-default values", () => {
    const state = { q: "ruff", tags: ["python", "ai"], sort: "reversed", page: 2 };

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
    const state = { q: "a b", tags: ["ai"], sort: "reversed", page: 4 };

    expect(readState("reading", writeState("reading", state, ""))).toEqual(state);
  });
});
