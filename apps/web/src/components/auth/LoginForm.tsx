"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import { Splash } from "@/components/ui/Splash";
import { parseApiError } from "@/lib/api-error";
import { loginFormSchema, type LoginFormValues } from "@/lib/auth-schemas";
import { useLoginMutation } from "@/store/api";
import { AuthCard } from "./AuthCard";
import { useRedirectWhenAuthenticated } from "./useRedirectWhenAuthenticated";

export function LoginForm() {
  const { status, target } = useRedirectWhenAuthenticated();
  const [login] = useLoginMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, unknown, z.output<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
    } catch (error) {
      const parsed = parseApiError(error, "Не удалось войти");
      setError("root", {
        message:
          parsed.status === 401
            ? "Неверный email или пароль"
            : parsed.status === 429
              ? "Слишком много попыток. Попробуйте позже"
              : parsed.message,
      });
    }
  });

  if (status !== "anonymous") return <Splash />;

  return (
    <AuthCard
      title="Вход"
      subtitle="Войдите, чтобы работать с приходами и продуктами"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href={`/register?next=${encodeURIComponent(target)}`}>Зарегистрироваться</Link>
        </>
      }
    >
      <form className="auth-page__form" noValidate onSubmit={onSubmit}>
        <FormField id="login-email" label="Email" required error={errors.email?.message}>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            {...fieldA11y("login-email", errors.email?.message)}
            {...register("email")}
          />
        </FormField>
        <FormField id="login-password" label="Пароль" required error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...fieldA11y("login-password", errors.password?.message)}
            {...register("password")}
          />
        </FormField>
        {errors.root?.message && (
          <p className="auth-page__error" role="alert">
            {errors.root.message}
          </p>
        )}
        <button type="submit" className="auth-page__submit" disabled={isSubmitting}>
          {isSubmitting ? "Вход…" : "Войти"}
        </button>
      </form>
    </AuthCard>
  );
}
