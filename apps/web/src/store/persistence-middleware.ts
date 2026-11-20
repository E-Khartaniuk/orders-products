import { createListenerMiddleware } from "@reduxjs/toolkit";
import { getStorage, writeJson } from "@/lib/storage";
import { PREFS_KEY, SESSION_KEY, type PersistedPrefs, type PersistedSession } from "./persisted";
import type { PrefsState } from "./prefs-slice";
import type { UiState } from "./ui-slice";

type PersistedSlices = { prefs: PrefsState; ui: UiState };

export function selectPersistedPrefs(state: PersistedSlices): PersistedPrefs {
  return {
    locale: state.prefs.locale,
    productTypeFilter: state.ui.productTypeFilter,
    productSpecificationFilter: state.ui.productSpecificationFilter,
    productStatusFilter: state.ui.productStatusFilter,
    productConditionFilter: state.ui.productConditionFilter,
  };
}

export function selectPersistedSession(state: PersistedSlices): PersistedSession {
  return { search: state.ui.search };
}

export const persistenceMiddleware = createListenerMiddleware();

persistenceMiddleware.startListening({
  predicate: (_action, current, previous) => {
    const cur = current as PersistedSlices;
    const prev = previous as PersistedSlices;
    return cur.prefs !== prev.prefs || cur.ui !== prev.ui;
  },
  effect: (_action, api) => {
    const state = api.getState() as PersistedSlices;
    writeJson(getStorage("local"), PREFS_KEY, selectPersistedPrefs(state));
    writeJson(getStorage("session"), SESSION_KEY, selectPersistedSession(state));
  },
});
