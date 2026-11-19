"use client";

import { useCallback } from "react";
import { useTranslations } from "use-intl";
import { parseApiError } from "./api-error";

export function useApiErrorParser() {
  const t = useTranslations("errors");
  return useCallback(
    (error: unknown, fallback: string) => parseApiError(error, fallback, t("network")),
    [t],
  );
}
