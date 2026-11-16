import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { load, save } from "../src/storage.ts";

describe("storage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn<(key: string) => string | null>((key: string) => store.get(key) ?? null),
      setItem: vi.fn<(key: string, value: string) => void>((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn<(key: string) => void>((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn<() => void>(() => {
        store.clear();
      }),
      key: vi.fn<(_index: number) => string | null>((_index: number) => null),
      length: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("loads a stored value", () => {
    store.set("test-key", "test-value");
    expect(load("test-key")).toBe("test-value");
  });

  test("returns null when key does not exist", () => {
    expect(load("non-existent")).toBeNull();
  });

  test("returns null when localStorage.getItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(load("test-key")).toBeNull();
  });

  test("saves a value to localStorage", () => {
    save("test-key", "my-value");
    expect(store.get("test-key")).toBe("my-value");
  });

  test("removes a key when value is null", () => {
    store.set("test-key", "existing");
    save("test-key", null);
    expect(store.has("test-key")).toBe(false);
  });

  test("handles localStorage.setItem errors gracefully", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => {
      save("test-key", "value");
    }).not.toThrow();
  });
});
