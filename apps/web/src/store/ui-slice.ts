import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { persistedStateRestored } from "./persisted";

export type UiState = {
  search: string;
  productTypeFilter: string;
};

const initialState: UiState = { search: "", productTypeFilter: "" };

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    searchChanged: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    productTypeFilterChanged: (state, action: PayloadAction<string>) => {
      state.productTypeFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(persistedStateRestored, (state, { payload }) => {
      if (payload.search !== undefined) state.search = payload.search;
      if (payload.productTypeFilter !== undefined) {
        state.productTypeFilter = payload.productTypeFilter;
      }
    });
  },
});

export const { searchChanged, productTypeFilterChanged } = uiSlice.actions;
