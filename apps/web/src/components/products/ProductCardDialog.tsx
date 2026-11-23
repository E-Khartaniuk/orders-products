"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "use-intl";
import type { z } from "zod";
import { Dialog, DialogError, DialogFooter } from "@/components/ui/Dialog";
import { currencyLabel, formatAmount, formatLongDate } from "@/lib/format";
import {
  createProductFormSchema,
  productToFormValues,
  toUpdateProductPayload,
  type ProductFormSchema,
  type ProductFormValues,
} from "@/lib/schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useGetProductTypesQuery, useUpdateProductMutation } from "@/store/api";
import type { Product } from "@/types/api";
import { ProductFormFields, showProductApiError } from "./ProductFormFields";
import { StatusLabel } from "./ProductStatus";
import { ProductThumb } from "./ProductThumb";

type ProductCardDialogProps = {
  product: Product | null;
  onClose: () => void;
};

/** Product card: read-only view of every field, with an "edit" mode on the same dialog. */
export function ProductCardDialog({ product, onClose }: ProductCardDialogProps) {
  const open = product !== null;
  const t = useTranslations("products.card");
  const tCreate = useTranslations("products.create");
  const tc = useTranslations("common");
  const locale = useLocale();
  const parseError = useApiErrorParser();
  const schema = useSchema(createProductFormSchema);

  const [editing, setEditing] = useState(false);
  // The list refetches after saving; until then show what the server returned.
  const [saved, setSaved] = useState<Product | null>(null);
  const shown = saved && product && saved.id === product.id ? saved : product;

  const [updateProduct] = useUpdateProductMutation();
  const { data: types } = useGetProductTypesQuery(undefined, { skip: !editing });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, z.output<ProductFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (editing) setFocus("title");
  }, [editing, setFocus]);

  const close = () => {
    setEditing(false);
    setSaved(null);
    onClose();
  };

  const startEditing = () => {
    if (!shown) return;
    reset(productToFormValues(shown));
    setEditing(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!shown) return;
    try {
      const updated = await updateProduct({
        id: shown.id,
        orderId: shown.order.id,
        body: toUpdateProductPayload(values),
      }).unwrap();
      setSaved(updated);
      setEditing(false);
    } catch (error) {
      showProductApiError(parseError(error, t("error")), setError, tCreate("duplicateSerial"));
    }
  });

  const price = (symbol: "USD" | "UAH") => {
    const item = shown?.prices.find((money) => money.symbol === symbol);
    return item ? `${formatAmount(item.value, locale)} ${currencyLabel(symbol)}` : tc("none");
  };

  return (
    <Dialog
      open={open}
      title={editing ? t("editTitle") : (shown?.title ?? "")}
      size="lg"
      locked={isSubmitting}
      onClose={close}
    >
      {shown && !editing && (
        <>
          <div className="dialog__body dialog__body--padded">
            <div className="product-card">
              <div className="product-card__photo">
                <ProductThumb src={shown.photo} type={shown.type} alt={shown.title} size="lg" />
              </div>
              <dl className="product-card__fields">
                <Field label={tCreate("serial")}>{shown.serialNumber}</Field>
                <Field label={tCreate("type")}>{shown.type}</Field>
                <Field label={tCreate("specification")} wide>
                  {shown.specification}
                </Field>
                <Field label={tCreate("status")}>
                  <StatusLabel status={shown.status} />
                </Field>
                <Field label={tCreate("condition")}>
                  {shown.isNew ? tCreate("conditionNew") : tCreate("conditionUsed")}
                </Field>
                <Field label={t("guarantee")} wide>
                  {formatLongDate(shown.guarantee.start, locale)} —{" "}
                  {formatLongDate(shown.guarantee.end, locale)}
                </Field>
                <Field label={tCreate("priceUsd")}>{price("USD")}</Field>
                <Field label={tCreate("priceUah")}>{price("UAH")}</Field>
                <Field label={t("order")} wide>
                  <Link
                    href={`/orders/${shown.order.id}`}
                    className="product-card__link"
                    onClick={close}
                  >
                    {shown.order.title}
                  </Link>
                </Field>
                <Field label={t("date")}>{formatLongDate(shown.date, locale)}</Field>
                <Field label={t("group")}>{shown.group?.title ?? tc("none")}</Field>
                <Field label={t("user")}>{shown.user?.name ?? tc("none")}</Field>
              </dl>
            </div>
          </div>
          <DialogFooter cancelLabel={tc("close")} onCancel={close}>
            <button type="button" className="dialog__action" onClick={startEditing}>
              <i className="bi bi-pencil-fill" aria-hidden="true" />
              {t("edit")}
            </button>
          </DialogFooter>
        </>
      )}

      {shown && editing && (
        <form className="dialog__form" noValidate onSubmit={onSubmit}>
          <div className="dialog__body dialog__body--padded">
            <div className="form">
              <ProductFormFields
                register={register}
                errors={errors}
                types={types?.items}
                idPrefix="product-edit"
              />
            </div>
          </div>
          <DialogError message={errors.root?.message} />
          <DialogFooter disabled={isSubmitting} onCancel={() => setEditing(false)}>
            <button type="submit" className="dialog__action" disabled={isSubmitting}>
              <i className="bi bi-check-lg" aria-hidden="true" />
              {isSubmitting ? tc("saving") : t("save")}
            </button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "product-card__field product-card__field--wide" : "product-card__field"}>
      <dt className="product-card__label">{label}</dt>
      <dd className="product-card__value">{children}</dd>
    </div>
  );
}
