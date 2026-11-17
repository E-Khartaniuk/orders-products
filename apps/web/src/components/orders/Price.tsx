"use client";

import { useLocale } from "use-intl";
import { currencyLabel, formatAmount, splitPrices } from "@/lib/format";
import type { Money } from "@/types/api";

type PriceProps = {
  prices: Money[];
  blockClass: string;
};

export function Price({ prices, blockClass }: PriceProps) {
  const locale = useLocale();
  const { primary, secondary } = splitPrices(prices);

  if (!primary) {
    return <span className={`${blockClass}__caption`}>—</span>;
  }

  return (
    <>
      {secondary && (
        <span className={`${blockClass}__caption`}>
          {formatAmount(secondary.value, locale)} {currencyLabel(secondary.symbol)}
        </span>
      )}
      <span className={`${blockClass}__value`}>
        {formatAmount(primary.value, locale)}{" "}
        <span className={`${blockClass}__currency`}>{currencyLabel(primary.symbol)}</span>
      </span>
    </>
  );
}
