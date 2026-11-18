import { describe, expect, it } from "vitest";
import { DEFAULT_PRODUCT_ICON, productIconFor } from "./product-icons";

describe("productIconFor", () => {
  it.each([
    ["Monitors", "bi-display"],
    ["Мониторы", "bi-display"],
    ["Laptops", "bi-laptop"],
    ["Ноутбуки", "bi-laptop"],
    ["Keyboards", "bi-keyboard"],
    ["Клавиатура", "bi-keyboard"],
    ["Motherboards", "bi-motherboard"],
    ["Gaming mouse", "bi-mouse"],
    ["SSD", "bi-device-ssd"],
    ["Desktop PC", "bi-pc-display"],
  ])("%s → %s", (type, icon) => {
    expect(productIconFor(type)).toBe(icon);
  });

  it("does not match short keywords inside other words", () => {
    expect(productIconFor("Pcie riser")).toBe(DEFAULT_PRODUCT_ICON);
    expect(productIconFor("Tvorog")).toBe(DEFAULT_PRODUCT_ICON);
  });

  it("falls back to a neutral icon", () => {
    expect(productIconFor("Furniture")).toBe(DEFAULT_PRODUCT_ICON);
    expect(productIconFor("")).toBe(DEFAULT_PRODUCT_ICON);
  });
});
