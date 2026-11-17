"use client";

import { useMemo } from "react";
import { useTranslations } from "use-intl";
import type { ValidationT } from "./validation";

export function useSchema<T>(factory: (t: ValidationT) => T) {
  const t = useTranslations("validation");
  return useMemo(() => factory(t), [factory, t]);
}
