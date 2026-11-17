import { DEFAULT_LOCALE, INTL_LOCALE, type Locale } from "@/i18n/config";
import type { Money } from "@/types/api";

const pad = (value: number) => String(value).padStart(2, "0");

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

const formatters = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function cached<T extends Intl.DateTimeFormat | Intl.NumberFormat>(key: string, create: () => T) {
  if (!formatters.has(key)) formatters.set(key, create());
  return formatters.get(key) as T;
}

const dateFormatter = (locale: Locale, options: Intl.DateTimeFormatOptions) =>
  cached(`date:${locale}:${JSON.stringify(options)}`, () => {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], options);
  });

const shortMonth = (date: Date, locale: Locale) =>
  capitalize(dateFormatter(locale, { month: "short" }).format(date).replace(".", ""));

export function formatMonthOfYear(value: string | Date) {
  return `${pad(toDate(value).getMonth() + 1)} / 12`;
}

export function formatLongDate(value: string | Date, locale: Locale = DEFAULT_LOCALE) {
  const date = toDate(value);
  return `${pad(date.getDate())} / ${shortMonth(date, locale)} / ${date.getFullYear()}`;
}

export function formatNumericDate(value: string | Date) {
  const date = toDate(value);
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

export function formatWeekday(date: Date, locale: Locale = DEFAULT_LOCALE) {
  return capitalize(dateFormatter(locale, { weekday: "long" }).format(date));
}

export function formatHeaderDate(date: Date, locale: Locale = DEFAULT_LOCALE) {
  return `${pad(date.getDate())} ${shortMonth(date, locale)}, ${date.getFullYear()}`;
}

export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatAmount(value: number, locale: Locale = DEFAULT_LOCALE) {
  const formatter = cached(`amount:${locale}`, () => {
    return new Intl.NumberFormat(INTL_LOCALE[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  });
  const formatted = formatter.format(value);
  return locale === "ru" ? formatted.replace(",", ".") : formatted;
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
