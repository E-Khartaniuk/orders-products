import { describe, expect, it } from "vitest";
import { sumByCurrency, toAmount } from "../src/lib/money.js";

describe("sumByCurrency", () => {
  it("sums prices per currency without floating point drift", () => {
    const totals = sumByCurrency([
      { value: "0.10", symbol: "USD" },
      { value: "0.20", symbol: "USD" },
      { value: 100, symbol: "UAH", isDefault: true },
      { value: "50.25", symbol: "UAH", isDefault: true },
    ]);

    expect(totals).toEqual([
      { symbol: "USD", value: 0.3, isDefault: false },
      { symbol: "UAH", value: 150.25, isDefault: true },
    ]);
  });

  it("returns an empty list for an order without products", () => {
    expect(sumByCurrency([])).toEqual([]);
  });
});

describe("toAmount", () => {
  it("rounds to cents", () => {
    expect(toAmount("10.005")).toBe(10.01);
    expect(toAmount(3)).toBe(3);
  });
});
