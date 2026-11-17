import { createAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import { readJson } from "@/lib/storage";

export const PREFS_KEY = "op:prefs:v1";
export const SESSION_KEY = "op:session:v1";

export const prefsSchema = z.object({
  locale: z.enum(LOCALES).optional(),
  productTypeFilter: z.string().max(64).optional(),
});

export const sessionSchema = z.object({
  search: z.string().max(200).optional(),
});

export type PersistedPrefs = z.infer<typeof prefsSchema>;
export type PersistedSession = z.infer<typeof sessionSchema>;
export type PersistedState = PersistedPrefs & PersistedSession;

export const persistedStateRestored = createAction<PersistedState>("persistence/restored");

export function readPersistedState(local: Storage | null, session: Storage | null): PersistedState {
  return {
    ...readJson(local, PREFS_KEY, prefsSchema),
    ...readJson(session, SESSION_KEY, sessionSchema),
  };
}
