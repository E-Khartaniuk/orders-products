import { z } from "zod";
import type { ValidationT } from "./validation";

const emailField = (t: ValidationT) =>
  z
    .string()
    .trim()
    .min(1, { message: t("emailRequired"), abort: true })
    .pipe(z.email(t("emailInvalid")));

export const createLoginFormSchema = (t: ValidationT) =>
  z.object({
    email: emailField(t),
    password: z.string().min(1, t("passwordRequired")),
  });

export type LoginFormSchema = ReturnType<typeof createLoginFormSchema>;
export type LoginFormValues = z.input<LoginFormSchema>;

export const createRegisterFormSchema = (t: ValidationT) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, t("minChars", { min: 2 }))
        .max(120, t("maxChars", { max: 120 })),
      email: emailField(t),
      password: z
        .string()
        .min(8, { message: t("minChars", { min: 8 }), abort: true })
        .max(128, t("maxChars", { max: 128 }))
        .regex(/[A-Za-zА-Яа-я]/, t("passwordLetter"))
        .regex(/\d/, t("passwordDigit")),
      confirmPassword: z.string().min(1, t("confirmRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordsMismatch"),
    });

export type RegisterFormSchema = ReturnType<typeof createRegisterFormSchema>;
export type RegisterFormValues = z.input<RegisterFormSchema>;

export function safeRedirect(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/orders";
  if (next.startsWith("/login") || next.startsWith("/register")) return "/orders";
  return next;
}
