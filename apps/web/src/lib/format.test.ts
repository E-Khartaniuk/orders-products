import { describe, expect, it } from "vitest";
import { parseApiError } from "./api-error";
import {
  formatAmount,
  formatLongDate,
  formatMonthOfYear,
  formatNumericDate,
  splitPrices,
} from "./format";

describe("date formats", () => {
  const date = "2017-04-06T10:00:00.000Z";

  it("formats month of year", () => {
    expect(formatMonthOfYear(date)).toBe("04 / 12");
  });

  it("formats long and numeric dates", () => {
    expect(formatLongDate(date)).toBe("06 / Апр / 2017");
    expect(formatNumericDate(date)).toBe("06 / 04 / 2017");
  });

  it("uses the requested locale for month names", () => {
    expect(formatLongDate(date, "en")).toBe("06 / Apr / 2017");
  });
});

describe("formatAmount", () => {
  it("groups thousands and keeps up to two decimals", () => {
    expect(formatAmount(250000.5).replace(/\s/g, " ")).toBe("250 000.5");
    expect(formatAmount(50)).toBe("50");
  });

  it("keeps English grouping and decimal separators", () => {
    expect(formatAmount(250000.5, "en")).toBe("250,000.5");
  });
});

describe("splitPrices", () => {
  it("uses the default currency as primary", () => {
    const { primary, secondary } = splitPrices([
      { symbol: "USD", value: 10, isDefault: false },
      { symbol: "UAH", value: 415, isDefault: true },
    ]);
    expect(primary?.symbol).toBe("UAH");
    expect(secondary?.symbol).toBe("USD");
  });
});

describe("parseApiError", () => {
  it("extracts message and details from API response", () => {
    const parsed = parseApiError(
      {
        status: 400,
        data: {
          error: { message: "Validation failed", details: [{ path: "title", message: "x" }] },
        },
      },
      "fallback",
    );
    expect(parsed).toEqual({
      status: 400,
      message: "Validation failed",
      details: [{ path: "title", message: "x" }],
    });
  });

  it("reports network errors", () => {
    const parsed = parseApiError({ status: "FETCH_ERROR", error: "Failed" }, "fallback", "offline");
    expect(parsed).toMatchObject({ status: null, message: "offline" });
  });
});
