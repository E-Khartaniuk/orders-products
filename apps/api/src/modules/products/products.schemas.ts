import { z } from "zod";
import { CURRENCIES } from "../../lib/money.js";

export const PRODUCT_STATUSES = ["FREE", "IN_REPAIR", "IN_USE"] as const;

export const productIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

const booleanParam = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean(),
);

export const listProductsQuery = z.object({
  type: z.string().trim().min(1).optional(),
  specification: z.string().trim().min(1).max(255).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  isNew: booleanParam.optional(),
  orderId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const listSpecificationsQuery = z.object({
  type: z.string().trim().min(1).optional(),
});

const priceInput = z.object({
  symbol: z.enum(CURRENCIES),
  value: z.coerce.number().nonnegative().max(9_999_999_999),
  isDefault: z.boolean().default(false),
});

const productFields = z.object({
  serialNumber: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(64),
  specification: z.string().trim().min(1).max(255),
  isNew: z.boolean().default(true),
  status: z.enum(PRODUCT_STATUSES).default("FREE"),
  guaranteeStart: z.coerce.date(),
  guaranteeEnd: z.coerce.date(),
  prices: z
    .array(priceInput)
    .min(1)
    .refine((prices) => new Set(prices.map((p) => p.symbol)).size === prices.length, {
      message: "Each currency may appear only once",
    }),
});

const guaranteeInOrder = (data: { guaranteeStart: Date; guaranteeEnd: Date }) =>
  data.guaranteeEnd >= data.guaranteeStart;
const guaranteeOrderError = () => ({
  path: ["guaranteeEnd"],
  message: "Guarantee end must not be earlier than guarantee start",
});

export const createProductBody = productFields
  .extend({
    photo: z.url().max(500).nullish(),
    date: z.coerce.date().optional(),
    orderId: z.number().int().positive(),
    groupId: z.number().int().positive().nullish(),
  })
  .refine(guaranteeInOrder, guaranteeOrderError());

/** Full replacement of the editable fields; order, photo and dates of receipt are not touched. */
export const updateProductBody = productFields.refine(guaranteeInOrder, guaranteeOrderError());

export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type ListSpecificationsQuery = z.infer<typeof listSpecificationsQuery>;
export type CreateProductBody = z.infer<typeof createProductBody>;
export type UpdateProductBody = z.infer<typeof updateProductBody>;
