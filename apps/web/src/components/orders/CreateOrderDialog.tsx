"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { Dialog, DialogError, DialogFooter } from "@/components/ui/Dialog";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import {
  createOrderFormSchema,
  toCreateOrderPayload,
  todayInputValue,
  type OrderFormSchema,
  type OrderFormValues,
} from "@/lib/schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useSchema } from "@/lib/use-schema";
import { useCreateOrderMutation } from "@/store/api";

const FIELDS = ["title", "description", "date"] as const;

type CreateOrderDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateOrderDialog({ open, onClose }: CreateOrderDialogProps) {
  const router = useRouter();
  const [createOrder] = useCreateOrderMutation();
  const t = useTranslations("orders.create");
  const tc = useTranslations("common");
  const parseError = useApiErrorParser();
  const schema = useSchema(createOrderFormSchema);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues, unknown, z.output<OrderFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { title: "", description: "", date: "" },
  });

  useEffect(() => {
    if (open) reset({ title: "", description: "", date: todayInputValue() });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const order = await createOrder(toCreateOrderPayload(values)).unwrap();
      onClose();
      router.push(`/orders/${order.id}`, { scroll: false });
    } catch (error) {
      const parsed = parseError(error, t("error"));
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

  const titleError = errors.title?.message;
  const descriptionError = errors.description?.message;
  const dateError = errors.date?.message;

  return (
    <Dialog open={open} title={t("title")} locked={isSubmitting} onClose={onClose}>
      <form className="dialog__form" noValidate onSubmit={onSubmit}>
        <div className="dialog__body dialog__body--padded">
          <div className="form">
            <FormField id="order-title" label={t("name")} required error={titleError} wide>
              <input
                type="text"
                autoComplete="off"
                maxLength={255}
                data-autofocus
                {...fieldA11y("order-title", titleError)}
                {...register("title")}
              />
            </FormField>
            <FormField id="order-date" label={t("date")} required error={dateError}>
              <input type="date" {...fieldA11y("order-date", dateError)} {...register("date")} />
            </FormField>
            <FormField
              id="order-description"
              label={t("description")}
              error={descriptionError}
              hint={t("descriptionHint")}
              wide
            >
              <textarea
                rows={3}
                maxLength={2000}
                {...fieldA11y("order-description", descriptionError, { hasHint: true })}
                {...register("description")}
              />
            </FormField>
          </div>
        </div>
        <DialogError message={errors.root?.message} />
        <DialogFooter disabled={isSubmitting} onCancel={onClose}>
          <button type="submit" className="dialog__action" disabled={isSubmitting}>
            <i className="bi bi-check-lg" aria-hidden="true" />
            {isSubmitting ? tc("saving") : t("submit")}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
