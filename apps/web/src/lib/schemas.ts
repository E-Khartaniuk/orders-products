import { z } from "zod";
import type { ProductStatus } from "@/types/api";
import type { ValidationT } from "./validation";
import { findWarehouse } from "./warehouses";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONEY = /^\d{1,10}([.,]\d{1,2})?$/;

const dateField = (t: ValidationT, requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, { message: requiredMessage, abort: true })
    .regex(ISO_DATE, t("invalidDate"))
    .refine((value) => !Number.isNaN(Date.parse(value)), t("invalidDate"));

const moneyField = (t: ValidationT) =>
  z
    .string()
    .trim()
    .min(1, { message: t("priceRequired"), abort: true })
    .regex(MONEY, t("priceFormat"));

const text = (t: ValidationT, requiredMessage: string, max: number) =>
  z.string().trim().min(1, requiredMessage).max(max, t("maxChars", { max }));

const toNumber = (value: string) => Number(value.replace(",", "."));
const toIsoDate = (value: string) => new Date(`${value}T00:00:00`).toISOString();

export function todayInputValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const createOrderFormSchema = (t: ValidationT) =>
  z.object({
    title: text(t, t("orderTitleRequired"), 255),
    description: z
      .string()
      .trim()
      .max(2000, t("maxChars", { max: 2000 })),
    date: dateField(t, t("orderDateRequired")),
    warehouse: z.string(),
  });

export type OrderFormSchema = ReturnType<typeof createOrderFormSchema>;
export type OrderFormValues = z.input<OrderFormSchema>;

export function toCreateOrderPayload(values: z.output<OrderFormSchema>) {
  return {
    title: values.title,
    description: values.description || null,
    date: toIsoDate(values.date),
    location: findWarehouse(values.warehouse),
  };
}

export const PRODUCT_STATUSES: ProductStatus[] = ["FREE", "IN_USE", "IN_REPAIR"];

export const createProductFormSchema = (t: ValidationT) =>
  z
    .object({
      serialNumber: text(t, t("serialRequired"), 64).regex(/^[A-Za-z0-9._-]+$/, t("serialFormat")),
      title: text(t, t("titleRequired"), 255),
      type: text(t, t("typeRequired"), 64),
      specification: text(t, t("specificationRequired"), 255),
      status: z.enum(["FREE", "IN_USE", "IN_REPAIR"]),
      condition: z.enum(["new", "used"]),
      guaranteeStart: dateField(t, t("guaranteeStartRequired")),
      guaranteeEnd: dateField(t, t("guaranteeEndRequired")),
      priceUsd: moneyField(t),
      priceUah: moneyField(t),
    })
    .refine((values) => values.guaranteeEnd >= values.guaranteeStart, {
      path: ["guaranteeEnd"],
      message: t("guaranteeOrder"),
    });

export type ProductFormSchema = ReturnType<typeof createProductFormSchema>;
export type ProductFormValues = z.input<ProductFormSchema>;

export function toCreateProductPayload(values: z.output<ProductFormSchema>, orderId: number) {
  return {
    orderId,
    serialNumber: values.serialNumber,
    title: values.title,
    type: values.type,
    specification: values.specification,
    status: values.status,
    isNew: values.condition === "new",
    guaranteeStart: toIsoDate(values.guaranteeStart),
    guaranteeEnd: toIsoDate(values.guaranteeEnd),
    prices: [
      { symbol: "USD" as const, value: toNumber(values.priceUsd), isDefault: false },
      { symbol: "UAH" as const, value: toNumber(values.priceUah), isDefault: true },
    ],
  };
}

export type CreateOrderPayload = ReturnType<typeof toCreateOrderPayload>;
export type CreateProductPayload = ReturnType<typeof toCreateProductPayload>;
