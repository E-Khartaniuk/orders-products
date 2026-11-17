import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
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
});

export const { searchChanged, productTypeFilterChanged } = uiSlice.actions;
