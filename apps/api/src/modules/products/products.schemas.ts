import { z } from "zod";
import { CURRENCIES } from "../../lib/money.js";

export const PRODUCT_STATUSES = ["FREE", "IN_REPAIR", "IN_USE"] as const;

export const productIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const listProductsQuery = z.object({
  type: z.string().trim().min(1).optional(),
  orderId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

const priceInput = z.object({
  symbol: z.enum(CURRENCIES),
  value: z.coerce.number().nonnegative().max(9_999_999_999),
  isDefault: z.boolean().default(false),
});

export const createProductBody = z
  .object({
    serialNumber: z.string().trim().min(1).max(64),
    title: z.string().trim().min(1).max(255),
    type: z.string().trim().min(1).max(64),
    specification: z.string().trim().min(1).max(255),
    isNew: z.boolean().default(true),
    status: z.enum(PRODUCT_STATUSES).default("FREE"),
    photo: z.url().max(500).nullish(),
    guaranteeStart: z.coerce.date(),
    guaranteeEnd: z.coerce.date(),
    date: z.coerce.date().optional(),
    orderId: z.number().int().positive(),
    groupId: z.number().int().positive().nullish(),
    prices: z
      .array(priceInput)
      .min(1)
      .refine((prices) => new Set(prices.map((p) => p.symbol)).size === prices.length, {
        message: "Each currency may appear only once",
      }),
  })
  .refine((data) => data.guaranteeEnd >= data.guaranteeStart, {
    path: ["guaranteeEnd"],
    message: "Guarantee end must not be earlier than guarantee start",
  });

export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type CreateProductBody = z.infer<typeof createProductBody>;
