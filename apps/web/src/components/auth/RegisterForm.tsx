"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import { Splash } from "@/components/ui/Splash";
import { parseApiError } from "@/lib/api-error";
import { registerFormSchema, type RegisterFormValues } from "@/lib/auth-schemas";
import { useRegisterMutation } from "@/store/api";
import { AuthCard } from "./AuthCard";
import { useRedirectWhenAuthenticated } from "./useRedirectWhenAuthenticated";

const FIELDS = ["name", "email", "password"] as const;

export function RegisterForm() {
  const { status, target } = useRedirectWhenAuthenticated();
  const [registerUser] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, z.output<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      await registerUser({ name, email, password }).unwrap();
    } catch (error) {
      const parsed = parseApiError(error, "Не удалось зарегистрироваться");
      if (parsed.status === 409) {
        setError("email", { message: "Пользователь с таким email уже существует" });
        return;
      }
      let mapped = false;
      for (const detail of parsed.details) {
        const field = FIELDS.find((name) => name === detail.path);
        if (field) {
          setError(field, { message: detail.message });
          mapped = true;
        }
      }
      if (!mapped) setError("root", { message: parsed.message });
    }
  });

  if (status !== "anonymous") return <Splash />;

  const err = (name: keyof RegisterFormValues) => errors[name]?.message;

  return (
    <AuthCard
      title="Регистрация"
      subtitle="Создайте аккаунт, чтобы вести учёт"
      footer={
        <>
          Уже есть аккаунт? <Link href={`/login?next=${encodeURIComponent(target)}`}>Войти</Link>
        </>
      }
    >
      <form className="auth-page__form" noValidate onSubmit={onSubmit}>
        <FormField id="register-name" label="Имя" required error={err("name")}>
          <input
            type="text"
            autoComplete="name"
            autoFocus
            {...fieldA11y("register-name", err("name"))}
            {...register("name")}
          />
        </FormField>
        <FormField id="register-email" label="Email" required error={err("email")}>
          <input
            type="email"
            autoComplete="email"
            {...fieldA11y("register-email", err("email"))}
            {...register("email")}
          />
        </FormField>
        <FormField
          id="register-password"
          label="Пароль"
          required
          error={err("password")}
          hint="Минимум 8 символов, буквы и цифры"
        >
          <input
            type="password"
            autoComplete="new-password"
            {...fieldA11y("register-password", err("password"), { hasHint: true })}
            {...register("password")}
          />
        </FormField>
        <FormField
          id="register-confirm"
          label="Повторите пароль"
          required
          error={err("confirmPassword")}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...fieldA11y("register-confirm", err("confirmPassword"))}
            {...register("confirmPassword")}
          />
        </FormField>
        {errors.root?.message && (
          <p className="auth-page__error" role="alert">
            {errors.root.message}
          </p>
        )}
        <button type="submit" className="auth-page__submit" disabled={isSubmitting}>
          {isSubmitting ? "Создание…" : "Создать аккаунт"}
        </button>
      </form>
    </AuthCard>
  );
}
