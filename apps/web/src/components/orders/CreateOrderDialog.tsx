"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Dialog, DialogError, DialogFooter } from "@/components/ui/Dialog";
import { FormField, fieldA11y } from "@/components/ui/FormField";
import { parseApiError } from "@/lib/api-error";
import {
  orderFormSchema,
  toCreateOrderPayload,
  todayInputValue,
  type OrderFormValues,
} from "@/lib/schemas";
import { useCreateOrderMutation } from "@/store/api";

const FIELDS = ["title", "description", "date"] as const;

type CreateOrderDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateOrderDialog({ open, onClose }: CreateOrderDialogProps) {
  const router = useRouter();
  const [createOrder] = useCreateOrderMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues, unknown, z.output<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
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
      const parsed = parseApiError(error, "Не удалось создать приход");
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
    <Dialog open={open} title="Новый приход" locked={isSubmitting} onClose={onClose}>
      <form className="dialog__form" noValidate onSubmit={onSubmit}>
        <div className="dialog__body dialog__body--padded">
          <div className="form">
            <FormField id="order-title" label="Название" required error={titleError} wide>
              <input
                type="text"
                autoComplete="off"
                maxLength={255}
                data-autofocus
                {...fieldA11y("order-title", titleError)}
                {...register("title")}
              />
            </FormField>
            <FormField id="order-date" label="Дата прихода" required error={dateError}>
              <input type="date" {...fieldA11y("order-date", dateError)} {...register("date")} />
            </FormField>
            <FormField
              id="order-description"
              label="Описание"
              error={descriptionError}
              hint="Необязательно, до 2000 символов"
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
            {isSubmitting ? "Сохранение…" : "Создать"}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
