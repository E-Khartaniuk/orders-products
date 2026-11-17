"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatLongDate } from "@/lib/format";
import { useDeleteOrderMutation } from "@/store/api";
import type { OrderSummary } from "@/types/api";

type DeleteOrderDialogProps = {
  order: OrderSummary | null;
  onClose: () => void;
  onDeleted: (order: OrderSummary) => void;
};

export function DeleteOrderDialog({ order, onClose, onDeleted }: DeleteOrderDialogProps) {
  const [deleteOrder, { isLoading }] = useDeleteOrderMutation();
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const confirm = async () => {
    if (!order) return;
    try {
      await deleteOrder(order.id).unwrap();
      onDeleted(order);
      close();
    } catch {
      setError(t("delete.error"));
    }
  };

  return (
    <ConfirmDialog
      open={order !== null}
      title={t("delete.title")}
      confirmLabel={tc("delete")}
      pending={isLoading}
      error={error}
      onConfirm={confirm}
      onClose={close}
    >
      {order && (
        <div className="product-line product-line--static">
          <span className="status-dot status-dot--in-use" aria-hidden="true" />
          <span className="order-row__list-icon" aria-hidden="true">
            <i className="bi bi-list-ul" />
          </span>
          <div className="product-line__info">
            <span className="product-line__title">{order.title}</span>
            <div className="product-line__serial">
              {t("productsCount", { count: order.productsCount })} ·{" "}
              {formatLongDate(order.date, locale)}
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
