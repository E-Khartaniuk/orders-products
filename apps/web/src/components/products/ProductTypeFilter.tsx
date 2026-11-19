"use client";

import { useTranslations } from "use-intl";
import { useAppDispatch, useAppSelector } from "@/store";
import { useGetProductTypesQuery } from "@/store/api";
import { productTypeFilterChanged } from "@/store/ui-slice";

export function ProductTypeFilter() {
  const t = useTranslations("products");
  const dispatch = useAppDispatch();
  const value = useAppSelector((state) => state.ui.productTypeFilter);
  const { data, isLoading } = useGetProductTypesQuery();

  return (
    <div className="filter">
      <label htmlFor="product-type-filter" className="filter__label">
        {t("typeFilter")}
      </label>
      <select
        id="product-type-filter"
        className="form-select filter__select"
        value={value}
        disabled={isLoading}
        onChange={(event) => dispatch(productTypeFilterChanged(event.target.value))}
      >
        <option value="">{t("allTypes")}</option>
        {data?.items.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
