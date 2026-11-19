import { createTranslator } from "use-intl";
import { describe, expect, it } from "vitest";
import { MESSAGES, isLocale } from "./config";

type Tree = { [key: string]: string | Tree };

const keysOf = (tree: Tree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`),
  );

describe("messages", () => {
  it("has the same keys in every locale", () => {
    expect(keysOf(MESSAGES.en).sort()).toEqual(keysOf(MESSAGES.ru).sort());
  });

  it.each([
    [1, "1 продукт"],
    [3, "3 продукта"],
    [11, "11 продуктов"],
    [23, "23 продукта"],
    [25, "25 продуктов"],
  ])("pluralizes %i in Russian", (count, expected) => {
    const t = createTranslator({ locale: "ru", messages: MESSAGES.ru, namespace: "orders" });
    expect(t("productsCount", { count })).toBe(expected);
  });

  it("pluralizes in English", () => {
    const t = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "orders" });
    expect(t("productsCount", { count: 1 })).toBe("1 product");
    expect(t("productsCount", { count: 4 })).toBe("4 products");
  });
});

describe("isLocale", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
