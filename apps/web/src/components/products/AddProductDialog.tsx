"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Path } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { Dialog, DialogError, DialogFooter } from "@/components/ui/Dialog";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import {
  PRODUCT_STATUSES,
  createProductFormSchema,
  toCreateProductPayload,
  todayInputValue,
  type ProductFormSchema,
  type ProductFormValues,
} from "@/lib/schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useCreateProductMutation, useGetProductTypesQuery } from "@/store/api";

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

const EMPTY_VALUES: ProductFormValues = {
  serialNumber: "",
  title: "",
  type: "",
  specification: "",
  status: "FREE",
  condition: "new",
  guaranteeStart: "",
  guaranteeEnd: "",
  priceUsd: "",
  priceUah: "",
};

type AddProductDialogProps = {
  order: { id: number; title: string } | null;
  onClose: () => void;
};

export function AddProductDialog({ order, onClose }: AddProductDialogProps) {
  const open = order !== null;
  const [createProduct] = useCreateProductMutation();
  const { data: types } = useGetProductTypesQuery(undefined, { skip: !open });
  const t = useTranslations("products.create");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const parseError = useApiErrorParser();
  const schema = useSchema(createProductFormSchema);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, z.output<ProductFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) reset({ ...EMPTY_VALUES, guaranteeStart: todayInputValue() });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!order) return;
    try {
      await createProduct(toCreateProductPayload(values, order.id)).unwrap();
      onClose();
    } catch (error) {
      const parsed = parseError(error, t("error"));
      if (parsed.status === 409) {
        setError("serialNumber", { message: t("duplicateSerial") });
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
  });

  const err = (name: keyof ProductFormValues) => errors[name]?.message;

  return (
    <Dialog
      open={open}
      title={order ? t("titleFor", { order: order.title }) : t("title")}
      size="lg"
      locked={isSubmitting}
      onClose={onClose}
    >
      <form className="dialog__form" noValidate onSubmit={onSubmit}>
        <div className="dialog__body dialog__body--padded">
          <div className="form">
            <FormField id="product-title" label={t("name")} required error={err("title")} wide>
              <input
                type="text"
                autoComplete="off"
                data-autofocus
                {...fieldA11y("product-title", err("title"))}
                {...register("title")}
              />
            </FormField>

            <FormField
              id="product-serial"
              label={t("serial")}
              required
              error={err("serialNumber")}
              hint={t("serialHint")}
            >
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                {...fieldA11y("product-serial", err("serialNumber"), { hasHint: true })}
                {...register("serialNumber")}
              />
            </FormField>

            <FormField id="product-type" label={t("type")} required error={err("type")}>
              <input
                type="text"
                list="product-type-options"
                autoComplete="off"
                {...fieldA11y("product-type", err("type"))}
                {...register("type")}
              />
              <datalist id="product-type-options">
                {types?.items.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </FormField>

            <FormField
              id="product-specification"
              label={t("specification")}
              required
              error={err("specification")}
              wide
            >
              <input
                type="text"
                autoComplete="off"
                {...fieldA11y("product-specification", err("specification"))}
                {...register("specification")}
              />
            </FormField>

            <FormField id="product-status" label={t("status")} required error={err("status")}>
              <select
                {...fieldA11y("product-status", err("status"), { control: "form-select" })}
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
              id="product-guarantee-start"
              label={t("guaranteeStart")}
              required
              error={err("guaranteeStart")}
            >
              <input
                type="date"
                {...fieldA11y("product-guarantee-start", err("guaranteeStart"))}
                {...register("guaranteeStart", { deps: ["guaranteeEnd"] })}
              />
            </FormField>

            <FormField
              id="product-guarantee-end"
              label={t("guaranteeEnd")}
              required
              error={err("guaranteeEnd")}
            >
              <input
                type="date"
                {...fieldA11y("product-guarantee-end", err("guaranteeEnd"))}
                {...register("guaranteeEnd")}
              />
            </FormField>

            <FormField
              id="product-price-usd"
              label={t("priceUsd")}
              required
              error={err("priceUsd")}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                {...fieldA11y("product-price-usd", err("priceUsd"))}
                {...register("priceUsd")}
              />
            </FormField>

            <FormField
              id="product-price-uah"
              label={t("priceUah")}
              required
              error={err("priceUah")}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                {...fieldA11y("product-price-uah", err("priceUah"))}
                {...register("priceUah")}
              />
            </FormField>
          </div>
        </div>
        <DialogError message={errors.root?.message} />
        <DialogFooter disabled={isSubmitting} onCancel={onClose}>
          <button type="submit" className="dialog__action" disabled={isSubmitting}>
            <i className="bi bi-plus-lg" aria-hidden="true" />
            {isSubmitting ? tc("saving") : t("submit")}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
