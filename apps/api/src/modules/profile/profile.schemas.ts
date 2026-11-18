import { z } from "zod";
import { LOCALES } from "../auth/auth.schemas.js";

export const updateProfileBody = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    locale: z.enum(LOCALES).optional(),
  })
  .refine((data) => data.name !== undefined || data.locale !== undefined, {
    message: "Nothing to update",
  });

export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
