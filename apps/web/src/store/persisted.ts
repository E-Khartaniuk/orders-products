import { createAction } from "@reduxjs/toolkit";
import { isLocale, type Locale } from "@/i18n/config";
import { STATUS_ORDER } from "@/lib/stats";
import { isOptionalString, isRecord, readJson } from "@/lib/storage";
import type { ProductStatus } from "@/types/api";

export const PREFS_KEY = "op:prefs:v1";
export const SESSION_KEY = "op:session:v1";

export const PRODUCT_CONDITIONS = ["new", "used"] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export type PersistedPrefs = {
  locale?: Locale;
  productTypeFilter?: string;
  productSpecificationFilter?: string;
  productStatusFilter?: ProductStatus | "";
  productConditionFilter?: ProductCondition | "";
};
export type PersistedSession = { search?: string };
export type PersistedState = PersistedPrefs & PersistedSession;

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T | "" =>
  value === "" || (allowed as readonly unknown[]).includes(value);

export function parsePrefs(value: unknown): PersistedPrefs | null {
  if (!isRecord(value)) return null;
  const {
    locale,
    productTypeFilter,
    productSpecificationFilter,
    productStatusFilter,
    productConditionFilter,
  } = value;
  if (locale !== undefined && !isLocale(locale)) return null;
  if (!isOptionalString(productTypeFilter, 64)) return null;
  if (!isOptionalString(productSpecificationFilter, 255)) return null;
  if (productStatusFilter !== undefined && !isOneOf(productStatusFilter, STATUS_ORDER)) {
    return null;
  }
  if (
    productConditionFilter !== undefined &&
    !isOneOf(productConditionFilter, PRODUCT_CONDITIONS)
  ) {
    return null;
  }
  return {
    ...(locale !== undefined && { locale }),
    ...(productTypeFilter !== undefined && { productTypeFilter: productTypeFilter as string }),
    ...(productSpecificationFilter !== undefined && {
      productSpecificationFilter: productSpecificationFilter as string,
    }),
    ...(productStatusFilter !== undefined && { productStatusFilter }),
    ...(productConditionFilter !== undefined && { productConditionFilter }),
  };
}

export function parseSession(value: unknown): PersistedSession | null {
  if (!isRecord(value) || !isOptionalString(value.search, 200)) return null;
  return value.search === undefined ? {} : { search: value.search as string };
}

export const persistedStateRestored = createAction<PersistedState>("persistence/restored");

export function readPersistedState(local: Storage | null, session: Storage | null): PersistedState {
  return {
    ...readJson(local, PREFS_KEY, parsePrefs),
    ...readJson(session, SESSION_KEY, parseSession),
  };
}
