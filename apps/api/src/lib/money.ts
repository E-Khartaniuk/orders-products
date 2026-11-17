export const CURRENCIES = ["USD", "UAH"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export type PriceLike = {
  value: number | string | { toString(): string };
  symbol: CurrencyCode;
  isDefault?: boolean;
};

export type MoneyTotal = { symbol: CurrencyCode; value: number; isDefault: boolean };

export const toAmount = (value: PriceLike["value"]) => Math.round(Number(value) * 100) / 100;

export function sumByCurrency(prices: PriceLike[]): MoneyTotal[] {
  const cents = new Map<CurrencyCode, number>();
  const defaults = new Set<CurrencyCode>();

  for (const price of prices) {
    cents.set(price.symbol, (cents.get(price.symbol) ?? 0) + Math.round(Number(price.value) * 100));
    if (price.isDefault) defaults.add(price.symbol);
  }

  return CURRENCIES.filter((symbol) => cents.has(symbol)).map((symbol) => ({
    symbol,
    value: (cents.get(symbol) ?? 0) / 100,
    isDefault: defaults.has(symbol),
  }));
}
