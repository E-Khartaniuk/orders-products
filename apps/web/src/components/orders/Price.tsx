import { currencyLabel, formatAmount, splitPrices } from "@/lib/format";
import type { Money } from "@/types/api";

type PriceProps = {
  prices: Money[];
  blockClass: string;
};

export function Price({ prices, blockClass }: PriceProps) {
  const { primary, secondary } = splitPrices(prices);

  if (!primary) {
    return <span className={`${blockClass}__caption`}>—</span>;
  }

  return (
    <>
      {secondary && (
        <span className={`${blockClass}__caption`}>
          {formatAmount(secondary.value)} {currencyLabel(secondary.symbol)}
        </span>
      )}
      <span className={`${blockClass}__value`}>
        {formatAmount(primary.value)}{" "}
        <span className={`${blockClass}__currency`}>{currencyLabel(primary.symbol)}</span>
      </span>
    </>
  );
}
