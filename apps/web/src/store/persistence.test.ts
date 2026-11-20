import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "./index";
import { PREFS_KEY, SESSION_KEY, persistedStateRestored, readPersistedState } from "./persisted";
import { localeChanged } from "./prefs-slice";
import {
  productConditionFilterChanged,
  productSpecificationFilterChanged,
  productStatusFilterChanged,
  productTypeFilterChanged,
  searchChanged,
} from "./ui-slice";

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

  it("restores all product filters and rejects unknown status or condition", () => {
    const filters = {
      productTypeFilter: "Monitors",
      productSpecificationFilter: "27 inch",
      productStatusFilter: "IN_REPAIR",
      productConditionFilter: "used",
    };
    const local = new MemoryStorage();
    local.setItem(PREFS_KEY, JSON.stringify(filters));
    expect(readPersistedState(local, null)).toEqual(filters);

    local.setItem(PREFS_KEY, JSON.stringify({ ...filters, productStatusFilter: "BROKEN" }));
    expect(readPersistedState(local, null)).toEqual({});

    local.setItem(PREFS_KEY, JSON.stringify({ ...filters, productConditionFilter: "old" }));
    expect(readPersistedState(local, null)).toEqual({});
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
    store.dispatch(productSpecificationFilterChanged("16 GB RAM"));
    store.dispatch(productStatusFilterChanged("FREE"));
    store.dispatch(productConditionFilterChanged("new"));
    store.dispatch(searchChanged("lenovo"));

    expect(JSON.parse(local.getItem(PREFS_KEY)!)).toEqual({
      locale: "en",
      productTypeFilter: "Laptops",
      productSpecificationFilter: "16 GB RAM",
      productStatusFilter: "FREE",
      productConditionFilter: "new",
    });
    expect(JSON.parse(session.getItem(SESSION_KEY)!)).toEqual({ search: "lenovo" });
  });

  it("restores state from a persisted snapshot", () => {
    const store = makeStore();
    store.dispatch(persistedStateRestored({ locale: "en", search: "lg" }));

    expect(store.getState().prefs.locale).toBe("en");
    expect(store.getState().ui).toEqual({
      search: "lg",
      productTypeFilter: "",
      productSpecificationFilter: "",
      productStatusFilter: "",
      productConditionFilter: "",
    });
  });

  it("clears the specification when the type changes, because specifications depend on it", () => {
    const store = makeStore();
    store.dispatch(productTypeFilterChanged("Monitors"));
    store.dispatch(productSpecificationFilterChanged("27 inch"));
    store.dispatch(productTypeFilterChanged("Monitors"));
    expect(store.getState().ui.productSpecificationFilter).toBe("27 inch");

    store.dispatch(productTypeFilterChanged("Laptops"));
    expect(store.getState().ui.productSpecificationFilter).toBe("");
  });
});
