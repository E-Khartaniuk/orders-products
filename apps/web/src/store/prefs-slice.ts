import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { credentialsReceived, userUpdated } from "./auth-slice";
import { persistedStateRestored } from "./persisted";

export type PrefsState = {
  locale: Locale;
};

const initialState: PrefsState = { locale: DEFAULT_LOCALE };

export const prefsSlice = createSlice({
  name: "prefs",
  initialState,
  reducers: {
    localeChanged: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(persistedStateRestored, (state, { payload }) => {
      if (payload.locale) state.locale = payload.locale;
    });
    builder.addCase(credentialsReceived, (state, { payload }) => {
      if (isLocale(payload.user.locale)) state.locale = payload.user.locale;
    });
    builder.addCase(userUpdated, (state, { payload }) => {
      if (isLocale(payload.locale)) state.locale = payload.locale;
    });
  },
});

export const { localeChanged } = prefsSlice.actions;
