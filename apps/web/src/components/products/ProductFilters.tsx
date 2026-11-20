"use client";

import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import { STATUS_ORDER } from "@/lib/stats";
import { useAppDispatch, useAppSelector } from "@/store";
import { useGetProductSpecificationsQuery, useGetProductTypesQuery } from "@/store/api";
import { PRODUCT_CONDITIONS, type ProductCondition } from "@/store/persisted";
import {
  productConditionFilterChanged,
  productSpecificationFilterChanged,
  productStatusFilterChanged,
  productTypeFilterChanged,
} from "@/store/ui-slice";
import type { ProductStatus } from "@/types/api";

type FilterProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
};

function Filter({ id, label, value, disabled, compact, onChange, children }: FilterProps) {
  return (
    <div className="filter">
      <label htmlFor={id} className="filter__label">
        {label}
      </label>
      <select
        id={id}
        className={`form-select filter__select${compact ? " filter__select--compact" : ""}`}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

export function ProductFilters() {
  const t = useTranslations("products");
  const tStatus = useTranslations("status");
  const dispatch = useAppDispatch();
  const type = useAppSelector((state) => state.ui.productTypeFilter);
  const specification = useAppSelector((state) => state.ui.productSpecificationFilter);
  const status = useAppSelector((state) => state.ui.productStatusFilter);
  const condition = useAppSelector((state) => state.ui.productConditionFilter);
  const types = useGetProductTypesQuery();
  const specifications = useGetProductSpecificationsQuery(type || undefined);

  return (
    <>
      <Filter
        id="product-type-filter"
        label={t("typeFilter")}
        value={type}
        disabled={types.isLoading}
        onChange={(value) => dispatch(productTypeFilterChanged(value))}
      >
        <option value="">{t("allTypes")}</option>
        {types.data?.items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Filter>

      <Filter
        id="product-specification-filter"
        label={t("specificationFilter")}
        value={specification}
        disabled={specifications.isLoading}
        onChange={(value) => dispatch(productSpecificationFilterChanged(value))}
      >
        <option value="">{t("allSpecifications")}</option>
        {specifications.data?.items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Filter>

      <Filter
        id="product-status-filter"
        label={t("statusFilter")}
        value={status}
        compact
        onChange={(value) => dispatch(productStatusFilterChanged(value as ProductStatus | ""))}
      >
        <option value="">{t("allStatuses")}</option>
        {STATUS_ORDER.map((item) => (
          <option key={item} value={item}>
            {tStatus(item)}
          </option>
        ))}
      </Filter>

      <Filter
        id="product-condition-filter"
        label={t("conditionFilter")}
        value={condition}
        compact
        onChange={(value) =>
          dispatch(productConditionFilterChanged(value as ProductCondition | ""))
        }
      >
        <option value="">{t("allConditions")}</option>
        {PRODUCT_CONDITIONS.map((item) => (
          <option key={item} value={item}>
            {t(`condition.${item}`)}
          </option>
        ))}
      </Filter>
    </>
  );
}
