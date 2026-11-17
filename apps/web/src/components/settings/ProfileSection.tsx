"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  AVATAR_TYPES,
  checkAvatarFile,
  createProfileFormSchema,
  type ProfileFormSchema,
  type ProfileFormValues,
} from "@/lib/profile-schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import {
  useDeleteAvatarMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "@/store/api";
import type { User } from "@/types/api";

export function ProfileSection({ user }: { user: User }) {
  const t = useTranslations("settings.profile");
  const tc = useTranslations("common");
  const parseError = useApiErrorParser();
  const schema = useSchema(createProfileFormSchema);
  const fileInput = useRef<HTMLInputElement>(null);

  const [updateProfile] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: deleting }] = useDeleteAvatarMutation();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues, unknown, z.output<ProfileFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: user.name },
  });

  useEffect(() => {
    reset({ name: user.name });
  }, [user.name, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      await updateProfile(values).unwrap();
      setSaved(true);
    } catch (error) {
      const parsed = parseError(error, t("saveError"));
      const nameDetail = parsed.details.find((detail) => detail.path === "name");
      setError(nameDetail ? "name" : "root", { message: nameDetail?.message ?? parsed.message });
    }
  });

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const problem = checkAvatarFile(file);
    if (problem) {
      setAvatarError(problem === "type" ? t("avatarType") : t("avatarSize"));
      return;
    }

    setAvatarError(null);
    try {
      await uploadAvatar(file).unwrap();
    } catch (error) {
      setAvatarError(parseError(error, t("avatarError")).message);
    }
  };

  const onRemove = async () => {
    setAvatarError(null);
    try {
      await deleteAvatar().unwrap();
    } catch (error) {
      setAvatarError(parseError(error, t("avatarError")).message);
    }
  };

  const nameError = errors.name?.message;
  const avatarBusy = uploading || deleting;

  return (
    <section className="settings__section" aria-labelledby="settings-profile">
      <h2 id="settings-profile" className="settings__title">
        {t("title")}
      </h2>

      <div className="settings__avatar">
        <UserAvatar
          src={user.avatarUrl}
          alt={t("avatarAlt")}
          size={96}
          className="settings__avatar-image"
        />
        <div className="settings__avatar-actions">
          <input
            ref={fileInput}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onFileChange}
          />
          <button
            type="button"
            className="settings__button"
            disabled={avatarBusy}
            onClick={() => fileInput.current?.click()}
          >
            <i className="bi bi-upload" aria-hidden="true" />
            {uploading ? t("uploading") : t("upload")}
          </button>
          {user.avatarUrl && (
            <button
              type="button"
              className="settings__button settings__button--ghost"
              disabled={avatarBusy}
              onClick={onRemove}
            >
              {deleting ? tc("deleting") : t("remove")}
            </button>
          )}
          <p className="settings__hint">{t("avatarHint")}</p>
          {avatarError && (
            <p className="form__error" role="alert">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      <form className="settings__form" noValidate onSubmit={onSubmit}>
        <FormField id="profile-name" label={t("name")} required error={nameError}>
          <input
            type="text"
            autoComplete="name"
            {...fieldA11y("profile-name", nameError)}
            {...register("name", { onChange: () => setSaved(false) })}
          />
        </FormField>
        <FormField id="profile-email" label={t("email")} hint={t("emailHint")}>
          <input
            type="email"
            value={user.email}
            readOnly
            {...fieldA11y("profile-email", undefined, { hasHint: true })}
          />
        </FormField>
        {errors.root?.message && (
          <p className="form__error" role="alert">
            {errors.root.message}
          </p>
        )}
        <div className="settings__actions">
          <button type="submit" className="settings__button" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? tc("saving") : t("save")}
          </button>
          {saved && (
            <span className="settings__saved" role="status">
              <i className="bi bi-check-circle-fill" aria-hidden="true" /> {t("saved")}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
