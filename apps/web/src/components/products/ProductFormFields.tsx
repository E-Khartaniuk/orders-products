"use client";

import type { FieldErrors, Path, UseFormRegister, UseFormSetError } from "react-hook-form";
import { useTranslations } from "use-intl";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import type { ParsedApiError } from "@/lib/api-error";
import { PRODUCT_STATUSES, type ProductFormValues } from "@/lib/schemas";

const SERVER_FIELD_MAP: Record<string, Path<ProductFormValues>> = {
  serialNumber: "serialNumber",
  title: "title",
  type: "type",
  specification: "specification",
  status: "status",
  guaranteeStart: "guaranteeStart",
  guaranteeEnd: "guaranteeEnd",
  prices: "priceUah",
};

/** Shows an API error next to the matching product form field, or as a form-level error. */
export function showProductApiError(
  parsed: ParsedApiError,
  setError: UseFormSetError<ProductFormValues>,
  duplicateSerialMessage: string,
) {
  if (parsed.status === 409) {
    setError("serialNumber", { message: duplicateSerialMessage });
    return;
  }
  let mapped = false;
  for (const detail of parsed.details) {
    const field = SERVER_FIELD_MAP[detail.path.split(".")[0]];
    if (field) {
      setError(field, { message: detail.message });
      mapped = true;
    }
  }
  if (!mapped) setError("root", { message: parsed.message });
}

type ProductFormFieldsProps = {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  types?: string[];
  /** Keeps element ids unique when more than one product form can be in the DOM. */
  idPrefix?: string;
};

/** Editable product fields shared by the "add product" and "edit product" forms. */
export function ProductFormFields({
  register,
  errors,
  types,
  idPrefix = "product",
}: ProductFormFieldsProps) {
  const t = useTranslations("products.create");
  const tStatus = useTranslations("status");
  const err = (name: keyof ProductFormValues) => errors[name]?.message;
  const id = (name: string) => `${idPrefix}-${name}`;
  const typesListId = id("type-options");

  return (
    <>
      <FormField id={id("title")} label={t("name")} required error={err("title")} wide>
        <input
          type="text"
          autoComplete="off"
          data-autofocus
          {...fieldA11y(id("title"), err("title"))}
          {...register("title")}
        />
      </FormField>

      <FormField
        id={id("serial")}
        label={t("serial")}
        required
        error={err("serialNumber")}
        hint={t("serialHint")}
      >
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          {...fieldA11y(id("serial"), err("serialNumber"), { hasHint: true })}
          {...register("serialNumber")}
        />
      </FormField>

      <FormField id={id("type")} label={t("type")} required error={err("type")}>
        <input
          type="text"
          list={typesListId}
          autoComplete="off"
          {...fieldA11y(id("type"), err("type"))}
          {...register("type")}
        />
        <datalist id={typesListId}>
          {types?.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </FormField>

      <FormField
        id={id("specification")}
        label={t("specification")}
        required
        error={err("specification")}
        wide
      >
        <input
          type="text"
          autoComplete="off"
          {...fieldA11y(id("specification"), err("specification"))}
          {...register("specification")}
        />
      </FormField>

      <FormField id={id("status")} label={t("status")} required error={err("status")}>
        <select
          {...fieldA11y(id("status"), err("status"), { control: "form-select" })}
          {...register("status")}
        >
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset className="form__field">
        <legend className="form__label">{t("condition")}</legend>
        <div className="form__switch">
          <label className="form__option">
            <input type="radio" value="new" {...register("condition")} />
            <span>{t("conditionNew")}</span>
          </label>
          <label className="form__option">
            <input type="radio" value="used" {...register("condition")} />
            <span>{t("conditionUsed")}</span>
          </label>
        </div>
      </fieldset>

      <FormField
        id={id("guarantee-start")}
        label={t("guaranteeStart")}
        required
        error={err("guaranteeStart")}
      >
        <input
          type="date"
          {...fieldA11y(id("guarantee-start"), err("guaranteeStart"))}
          {...register("guaranteeStart", { deps: ["guaranteeEnd"] })}
        />
      </FormField>

      <FormField
        id={id("guarantee-end")}
        label={t("guaranteeEnd")}
        required
        error={err("guaranteeEnd")}
      >
        <input
          type="date"
          {...fieldA11y(id("guarantee-end"), err("guaranteeEnd"))}
          {...register("guaranteeEnd")}
        />
      </FormField>

      <FormField id={id("price-usd")} label={t("priceUsd")} required error={err("priceUsd")}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          {...fieldA11y(id("price-usd"), err("priceUsd"))}
          {...register("priceUsd")}
        />
      </FormField>

      <FormField id={id("price-uah")} label={t("priceUah")} required error={err("priceUah")}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          {...fieldA11y(id("price-uah"), err("priceUah"))}
          {...register("priceUah")}
        />
      </FormField>
    </>
  );
}
