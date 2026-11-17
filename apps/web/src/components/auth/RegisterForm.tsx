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
  createRegisterFormSchema,
  type RegisterFormSchema,
  type RegisterFormValues,
} from "@/lib/auth-schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useRegisterMutation } from "@/store/api";
import { AuthCard } from "./AuthCard";
import { useRedirectWhenAuthenticated } from "./useRedirectWhenAuthenticated";

const FIELDS = ["name", "email", "password"] as const;

export function RegisterForm() {
  const { status, target } = useRedirectWhenAuthenticated();
  const [registerUser] = useRegisterMutation();
  const t = useTranslations("auth");
  const parseError = useApiErrorParser();
  const schema = useSchema(createRegisterFormSchema);
  useDocumentTitle(t("register.title"));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, z.output<RegisterFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      await registerUser({ name, email, password }).unwrap();
    } catch (error) {
      const parsed = parseError(error, t("register.error"));
      if (parsed.status === 409) {
        setError("email", { message: t("register.duplicateEmail") });
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
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          {t("register.haveAccount")}{" "}
          <Link href={`/login?next=${encodeURIComponent(target)}`}>{t("register.toLogin")}</Link>
        </>
      }
    >
      <form className="auth-page__form" noValidate onSubmit={onSubmit}>
        <FormField id="register-name" label={t("register.name")} required error={err("name")}>
          <input
            type="text"
            autoComplete="name"
            autoFocus
            {...fieldA11y("register-name", err("name"))}
            {...register("name")}
          />
        </FormField>
        <FormField id="register-email" label={t("email")} required error={err("email")}>
          <input
            type="email"
            autoComplete="email"
            {...fieldA11y("register-email", err("email"))}
            {...register("email")}
          />
        </FormField>
        <FormField
          id="register-password"
          label={t("password")}
          required
          error={err("password")}
          hint={t("register.passwordHint")}
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
          label={t("register.confirmPassword")}
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
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </button>
      </form>
    </AuthCard>
  );
}
