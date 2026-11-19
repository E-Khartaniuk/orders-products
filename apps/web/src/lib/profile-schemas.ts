import { z } from "zod";
import type { ValidationT } from "./validation";

export const createProfileFormSchema = (t: ValidationT) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, t("minChars", { min: 2 }))
      .max(120, t("maxChars", { max: 120 })),
  });

export type ProfileFormSchema = ReturnType<typeof createProfileFormSchema>;
export type ProfileFormValues = z.input<ProfileFormSchema>;

export const createPasswordFormSchema = (t: ValidationT) =>
  z
    .object({
      currentPassword: z.string().min(1, t("passwordRequired")),
      newPassword: z
        .string()
        .min(8, { message: t("minChars", { min: 8 }), abort: true })
        .max(128, t("maxChars", { max: 128 }))
        .regex(/[A-Za-zА-Яа-я]/, t("passwordLetter"))
        .regex(/\d/, t("passwordDigit")),
      confirmPassword: z.string().min(1, t("confirmRequired")),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordsMismatch"),
    });

export type PasswordFormSchema = ReturnType<typeof createPasswordFormSchema>;
export type PasswordFormValues = z.input<PasswordFormSchema>;
