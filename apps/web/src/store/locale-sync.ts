import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { Locale } from "@/i18n/config";
import type { User } from "@/types/api";
import { api } from "./api";
import { credentialsReceived } from "./auth-slice";
import { localeChanged } from "./prefs-slice";

type SyncState = {
  auth: { status: string; user: User | null };
  prefs: { locale: Locale };
};

export const localeSyncMiddleware = createListenerMiddleware();

function saveLocale(dispatch: (action: unknown) => unknown, locale: Locale) {
  const request = dispatch(api.endpoints.updateProfile.initiate({ locale })) as ReturnType<
    ReturnType<typeof api.endpoints.updateProfile.initiate>
  >;
  request
    .unwrap()
    .catch(() => undefined)
    .finally(() => request.reset());
}

localeSyncMiddleware.startListening({
  actionCreator: localeChanged,
  effect: (action, listenerApi) => {
    const { auth } = listenerApi.getState() as SyncState;
    if (auth.status !== "authenticated" || auth.user?.locale === action.payload) return;
    saveLocale(listenerApi.dispatch, action.payload);
  },
});

localeSyncMiddleware.startListening({
  actionCreator: credentialsReceived,
  effect: (action, listenerApi) => {
    if (action.payload.user.locale) return;
    const { prefs } = listenerApi.getState() as SyncState;
    saveLocale(listenerApi.dispatch, prefs.locale);
  },
});
