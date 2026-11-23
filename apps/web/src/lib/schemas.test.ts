import { createTranslator } from "use-intl";
import { describe, expect, it } from "vitest";
import ru from "@/i18n/messages/ru.json";
import {
  createOrderFormSchema,
  createProductFormSchema,
  productToFormValues,
  toCreateOrderPayload,
  toCreateProductPayload,
  toUpdateProductPayload,
  todayInputValue,
  type ProductFormValues,
} from "./schemas";
import type { Product } from "@/types/api";

const t = createTranslator({ locale: "ru", messages: ru, namespace: "validation" });
const orderFormSchema = createOrderFormSchema(t);
const productFormSchema = createProductFormSchema(t);

const validProduct: ProductFormValues = {
  serialNumber: "SN-12.3456789",
  title: "Gigabyte X58-USB3",
  type: "Motherboards",
  specification: "Socket 1366",
  status: "FREE",
  condition: "used",
  guaranteeStart: "2024-01-01",
  guaranteeEnd: "2026-01-01",
  priceUsd: "100,5",
  priceUah: "4170.75",
};

const issuesOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("orderFormSchema", () => {
  it("accepts a valid order and trims the title", () => {
    const result = orderFormSchema.parse({
      title: "  Order  ",
      description: "",
      date: "2024-05-01",
      warehouse: "Lviv",
    });
    expect(result.title).toBe("Order");
    expect(toCreateOrderPayload(result)).toMatchObject({
      title: "Order",
      description: null,
      location: { city: "Lviv" },
    });
  });

  it("requires title and a valid date", () => {
    const result = orderFormSchema.safeParse({
      title: "   ",
      description: "",
      date: "01.05.2024",
      warehouse: "",
    });
    expect(issuesOf(result)).toEqual(["title", "date"]);
  });
});

describe("productFormSchema", () => {
  it("builds the API payload with both prices", () => {
    const values = productFormSchema.parse(validProduct);
    const payload = toCreateProductPayload(values, 7);

    expect(payload).toMatchObject({
      orderId: 7,
      isNew: false,
      prices: [
        { symbol: "USD", value: 100.5, isDefault: false },
        { symbol: "UAH", value: 4170.75, isDefault: true },
      ],
    });
  });

  it("rejects guarantee end earlier than start", () => {
    const result = productFormSchema.safeParse({ ...validProduct, guaranteeEnd: "2023-12-31" });
    expect(issuesOf(result)).toEqual(["guaranteeEnd"]);
  });

  it("rejects malformed serial number and prices", () => {
    const result = productFormSchema.safeParse({
      ...validProduct,
      serialNumber: "SN 1",
      priceUsd: "12.345",
      priceUah: "",
    });
    expect(issuesOf(result)).toEqual(["serialNumber", "priceUsd", "priceUah"]);
  });
});

describe("todayInputValue", () => {
  it("formats a date for input[type=date]", () => {
    expect(todayInputValue(new Date(2024, 0, 5))).toBe("2024-01-05");
  });
});

describe("productToFormValues", () => {
  const product: Product = {
    id: 5,
    serialNumber: "SN-12.3456789",
    isNew: false,
    photo: null,
    title: "Samsung 27",
    type: "Monitors",
    specification: "27 inch",
    status: "IN_REPAIR",
    guarantee: {
      start: new Date(2024, 0, 1).toISOString(),
      end: new Date(2026, 5, 30).toISOString(),
    },
    date: new Date(2024, 0, 1).toISOString(),
    prices: [
      { symbol: "USD", value: 250, isDefault: false },
      { symbol: "UAH", value: 10375.5, isDefault: true },
    ],
    order: { id: 7, title: "Order 7" },
    group: null,
    user: null,
  };

  it("pre-fills the form with the product", () => {
    expect(productToFormValues(product)).toEqual({
      serialNumber: "SN-12.3456789",
      title: "Samsung 27",
      type: "Monitors",
      specification: "27 inch",
      status: "IN_REPAIR",
      condition: "used",
      guaranteeStart: "2024-01-01",
      guaranteeEnd: "2026-06-30",
      priceUsd: "250",
      priceUah: "10375.5",
    });
  });

  it("round-trips through the form without changing the product", () => {
    const values = productFormSchema.parse(productToFormValues(product));
    const payload = toUpdateProductPayload(values);

    expect(payload).not.toHaveProperty("orderId");
    expect(payload).toMatchObject({
      status: "IN_REPAIR",
      isNew: false,
      guaranteeStart: product.guarantee.start,
      guaranteeEnd: product.guarantee.end,
      prices: [
        { symbol: "USD", value: 250 },
        { symbol: "UAH", value: 10375.5 },
      ],
    });
  });
});
