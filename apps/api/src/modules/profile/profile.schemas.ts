import { z } from "zod";

export const updateProfileBody = z.object({
  name: z.string().trim().min(2).max(120),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
