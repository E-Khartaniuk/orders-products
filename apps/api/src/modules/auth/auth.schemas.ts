import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email().max(191));

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const registerBody = z.object({
  email,
  name: z.string().trim().min(2).max(120),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-zА-Яа-я]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a digit"),
});

export type LoginBody = z.infer<typeof loginBody>;
export type RegisterBody = z.infer<typeof registerBody>;
