import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

type PrefsState = {
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
});

export const { localeChanged } = prefsSlice.actions;
