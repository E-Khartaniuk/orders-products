import { z } from "zod";

export const orderIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const listOrdersQuery = z.object({
  search: z.string().trim().min(1).max(100).optional(),
});

export const createOrderBody = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).nullish(),
  date: z.coerce.date().optional(),
});

export const updateOrderBody = createOrderBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });

export type ListOrdersQuery = z.infer<typeof listOrdersQuery>;
export type CreateOrderBody = z.infer<typeof createOrderBody>;
export type UpdateOrderBody = z.infer<typeof updateOrderBody>;
