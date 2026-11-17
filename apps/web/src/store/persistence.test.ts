import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "./index";
import { PREFS_KEY, SESSION_KEY, persistedStateRestored, readPersistedState } from "./persisted";
import { localeChanged } from "./prefs-slice";
import { productTypeFilterChanged, searchChanged } from "./ui-slice";

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readPersistedState", () => {
  it("merges valid prefs and session values", () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    local.setItem(PREFS_KEY, JSON.stringify({ locale: "en", productTypeFilter: "Monitors" }));
    session.setItem(SESSION_KEY, JSON.stringify({ search: "asus" }));

    expect(readPersistedState(local, session)).toEqual({
      locale: "en",
      productTypeFilter: "Monitors",
      search: "asus",
    });
  });

  it("ignores corrupted or invalid values", () => {
    const local = new MemoryStorage();
    local.setItem(PREFS_KEY, JSON.stringify({ locale: "de" }));
    const session = new MemoryStorage();
    session.setItem(SESSION_KEY, "{not json");

    expect(readPersistedState(local, session)).toEqual({});
  });

  it("works without storage", () => {
    expect(readPersistedState(null, null)).toEqual({});
  });
});

describe("persistence middleware", () => {
  it("writes prefs to localStorage and search to sessionStorage", () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });

    const store = makeStore();
    store.dispatch(localeChanged("en"));
    store.dispatch(productTypeFilterChanged("Laptops"));
    store.dispatch(searchChanged("lenovo"));

    expect(JSON.parse(local.getItem(PREFS_KEY)!)).toEqual({
      locale: "en",
      productTypeFilter: "Laptops",
    });
    expect(JSON.parse(session.getItem(SESSION_KEY)!)).toEqual({ search: "lenovo" });
  });

  it("restores state from a persisted snapshot", () => {
    const store = makeStore();
    store.dispatch(persistedStateRestored({ locale: "en", search: "lg" }));

    expect(store.getState().prefs.locale).toBe("en");
    expect(store.getState().ui).toEqual({ search: "lg", productTypeFilter: "" });
  });
});
