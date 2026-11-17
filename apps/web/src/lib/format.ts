import type { Money } from "@/types/api";

const LOCALE = "ru-RU";

const pad = (value: number) => String(value).padStart(2, "0");

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const shortMonth = (date: Date) =>
  capitalize(new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(date).replace(".", ""));

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

export function formatMonthOfYear(value: string | Date) {
  return `${pad(toDate(value).getMonth() + 1)} / 12`;
}

export function formatLongDate(value: string | Date) {
  const date = toDate(value);
  return `${pad(date.getDate())} / ${shortMonth(date)} / ${date.getFullYear()}`;
}

export function formatNumericDate(value: string | Date) {
  const date = toDate(value);
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

export function formatWeekday(date: Date) {
  return capitalize(new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(date));
}

export function formatHeaderDate(date: Date) {
  return `${pad(date.getDate())} ${shortMonth(date)}, ${date.getFullYear()}`;
}

export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number) {
  return amountFormatter.format(value).replace(",", ".");
}

const CURRENCY_LABEL: Record<Money["symbol"], string> = { USD: "$", UAH: "UAH" };

export function currencyLabel(symbol: Money["symbol"]) {
  return CURRENCY_LABEL[symbol];
}

export function splitPrices(prices: Money[]) {
  const primary = prices.find((price) => price.isDefault) ?? prices[0];
  const secondary = prices.find((price) => price !== primary);
  return { primary, secondary };
}

export function pluralize(count: number, forms: [one: string, few: string, many: string]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const PRODUCT_FORMS: [string, string, string] = ["Продукт", "Продукта", "Продуктов"];
