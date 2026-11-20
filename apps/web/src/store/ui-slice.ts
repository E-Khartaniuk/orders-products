import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProductStatus } from "@/types/api";
import { persistedStateRestored, type ProductCondition } from "./persisted";

export type UiState = {
  search: string;
  productTypeFilter: string;
  productSpecificationFilter: string;
  productStatusFilter: ProductStatus | "";
  productConditionFilter: ProductCondition | "";
};

const initialState: UiState = {
  search: "",
  productTypeFilter: "",
  productSpecificationFilter: "",
  productStatusFilter: "",
  productConditionFilter: "",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    searchChanged: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    productTypeFilterChanged: (state, action: PayloadAction<string>) => {
      if (state.productTypeFilter !== action.payload) state.productSpecificationFilter = "";
      state.productTypeFilter = action.payload;
    },
    productSpecificationFilterChanged: (state, action: PayloadAction<string>) => {
      state.productSpecificationFilter = action.payload;
    },
    productStatusFilterChanged: (state, action: PayloadAction<ProductStatus | "">) => {
      state.productStatusFilter = action.payload;
    },
    productConditionFilterChanged: (state, action: PayloadAction<ProductCondition | "">) => {
      state.productConditionFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(persistedStateRestored, (state, { payload }) => {
      if (payload.search !== undefined) state.search = payload.search;
      if (payload.productTypeFilter !== undefined) {
        state.productTypeFilter = payload.productTypeFilter;
      }
      if (payload.productSpecificationFilter !== undefined) {
        state.productSpecificationFilter = payload.productSpecificationFilter;
      }
      if (payload.productStatusFilter !== undefined) {
        state.productStatusFilter = payload.productStatusFilter;
      }
      if (payload.productConditionFilter !== undefined) {
        state.productConditionFilter = payload.productConditionFilter;
      }
    });
  },
});

export const {
  searchChanged,
  productTypeFilterChanged,
  productSpecificationFilterChanged,
  productStatusFilterChanged,
  productConditionFilterChanged,
} = uiSlice.actions;
