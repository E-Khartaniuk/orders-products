import en from "./messages/en.json";
import ru from "./messages/ru.json";

export const LOCALES = ["ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const TIME_ZONE = "Europe/Kyiv";

export const INTL_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-US" };

export const LOCALE_LABEL: Record<Locale, string> = { ru: "RU", en: "EN" };

export const MESSAGES = { ru, en } satisfies Record<Locale, typeof ru>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
