import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, { message: "Введите email", abort: true })
  .pipe(z.email("Некорректный email"));

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Введите пароль"),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, "Не короче 2 символов").max(120, "Не более 120 символов"),
    email: emailField,
    password: z
      .string()
      .min(8, { message: "Не короче 8 символов", abort: true })
      .max(128, "Не более 128 символов")
      .regex(/[A-Za-zА-Яа-я]/, "Добавьте хотя бы одну букву")
      .regex(/\d/, "Добавьте хотя бы одну цифру"),
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export type RegisterFormValues = z.input<typeof registerFormSchema>;

export function safeRedirect(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/orders";
  if (next.startsWith("/login") || next.startsWith("/register")) return "/orders";
  return next;
}
