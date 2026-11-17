import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
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
  },
});

export const { localeChanged } = prefsSlice.actions;
