"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import { Splash } from "@/components/ui/Splash";
import { useDocumentTitle } from "@/i18n/use-document-title";
import {
  createLoginFormSchema,
  type LoginFormSchema,
  type LoginFormValues,
} from "@/lib/auth-schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useLoginMutation } from "@/store/api";
import { AuthCard } from "./AuthCard";
import { useRedirectWhenAuthenticated } from "./useRedirectWhenAuthenticated";

export function LoginForm() {
  const { status, target } = useRedirectWhenAuthenticated();
  const [login] = useLoginMutation();
  const t = useTranslations("auth");
  const parseError = useApiErrorParser();
  const schema = useSchema(createLoginFormSchema);
  useDocumentTitle(t("login.title"));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, unknown, z.output<LoginFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
    } catch (error) {
      const parsed = parseError(error, t("login.error"));
      setError("root", {
        message:
          parsed.status === 401
            ? t("login.invalidCredentials")
            : parsed.status === 429
              ? t("login.tooManyAttempts")
              : parsed.message,
      });
    }
  });

  if (status !== "anonymous") return <Splash />;

  return (
    <AuthCard
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link href={`/register?next=${encodeURIComponent(target)}`}>{t("login.toRegister")}</Link>
        </>
      }
    >
      <form className="auth-page__form" noValidate onSubmit={onSubmit}>
        <FormField id="login-email" label={t("email")} required error={errors.email?.message}>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            {...fieldA11y("login-email", errors.email?.message)}
            {...register("email")}
          />
        </FormField>
        <FormField
          id="login-password"
          label={t("password")}
          required
          error={errors.password?.message}
        >
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
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </AuthCard>
  );
}
