import { z } from "zod";
import type { ProductStatus } from "@/types/api";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONEY = /^\d{1,10}([.,]\d{1,2})?$/;

const dateField = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, { message: requiredMessage, abort: true })
    .regex(ISO_DATE, "Некорректная дата")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Некорректная дата");

const moneyField = z
  .string()
  .trim()
  .min(1, { message: "Укажите цену", abort: true })
  .regex(MONEY, "Формат: 1234.56");

const toNumber = (value: string) => Number(value.replace(",", "."));
const toIsoDate = (value: string) => new Date(`${value}T00:00:00`).toISOString();

export function todayInputValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const orderFormSchema = z.object({
  title: z.string().trim().min(1, "Введите название прихода").max(255, "Не более 255 символов"),
  description: z.string().trim().max(2000, "Не более 2000 символов"),
  date: dateField("Укажите дату прихода"),
});

export type OrderFormValues = z.input<typeof orderFormSchema>;

export function toCreateOrderPayload(values: z.output<typeof orderFormSchema>) {
  return {
    title: values.title,
    description: values.description || null,
    date: toIsoDate(values.date),
  };
}

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "FREE", label: "Свободен" },
  { value: "IN_USE", label: "Используется" },
  { value: "IN_REPAIR", label: "В ремонте" },
];

export const productFormSchema = z
  .object({
    serialNumber: z
      .string()
      .trim()
      .min(1, "Введите серийный номер")
      .max(64, "Не более 64 символов")
      .regex(/^[A-Za-z0-9._-]+$/, "Только латиница, цифры, точка, дефис и подчёркивание"),
    title: z.string().trim().min(1, "Введите название").max(255, "Не более 255 символов"),
    type: z.string().trim().min(1, "Укажите тип").max(64, "Не более 64 символов"),
    specification: z
      .string()
      .trim()
      .min(1, "Укажите спецификацию")
      .max(255, "Не более 255 символов"),
    status: z.enum(["FREE", "IN_USE", "IN_REPAIR"]),
    condition: z.enum(["new", "used"]),
    guaranteeStart: dateField("Укажите начало гарантии"),
    guaranteeEnd: dateField("Укажите окончание гарантии"),
    priceUsd: moneyField,
    priceUah: moneyField,
  })
  .refine((values) => values.guaranteeEnd >= values.guaranteeStart, {
    path: ["guaranteeEnd"],
    message: "Окончание гарантии не может быть раньше начала",
  });

export type ProductFormValues = z.input<typeof productFormSchema>;

export function toCreateProductPayload(
  values: z.output<typeof productFormSchema>,
  orderId: number,
) {
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
