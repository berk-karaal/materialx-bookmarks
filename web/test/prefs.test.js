import { beforeEach, describe, expect, it, vi } from "vitest";

import { readPref, writePref } from "../src/prefs.js";

function useStorage(storage) {
  vi.stubGlobal("window", { localStorage: storage });
}

function memoryStorage() {
  const entries = new Map();
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

function brokenStorage() {
  return {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
}

describe("preferences", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("namespaces the key by fence id", () => {
    const storage = memoryStorage();
    useStorage(storage);

    writePref("tools", "view", "blocks");

    expect(storage.entries.get("mxb.tools.view")).toBe("blocks");
  });

  it("reads a stored value back", () => {
    useStorage(memoryStorage());

    writePref("tools", "view", "blocks");

    expect(readPref("tools", "view", ["list", "blocks"], "list")).toBe("blocks");
  });

  it("keeps two collections on one page apart", () => {
    useStorage(memoryStorage());

    writePref("tools", "view", "blocks");

    expect(readPref("reading", "view", ["list", "blocks"], "list")).toBe("list");
  });

  it("falls back when the stored value is no longer offered", () => {
    useStorage(memoryStorage());

    writePref("tools", "view", "compact");

    expect(readPref("tools", "view", ["list", "blocks"], "list")).toBe("list");
  });

  it("falls back when nothing is stored", () => {
    useStorage(memoryStorage());

    expect(readPref("tools", "view", ["list"], "list")).toBe("list");
  });

  it("survives storage that throws", () => {
    useStorage(brokenStorage());

    expect(() => writePref("tools", "view", "blocks")).not.toThrow();
    expect(readPref("tools", "view", ["blocks"], "list")).toBe("list");
  });
});
