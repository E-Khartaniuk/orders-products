"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PRODUCT_FORMS, formatLongDate, pluralize } from "@/lib/format";
import { useDeleteOrderMutation } from "@/store/api";
import type { OrderSummary } from "@/types/api";

type DeleteOrderDialogProps = {
  order: OrderSummary | null;
  onClose: () => void;
  onDeleted: (order: OrderSummary) => void;
};

export function DeleteOrderDialog({ order, onClose, onDeleted }: DeleteOrderDialogProps) {
  const [deleteOrder, { isLoading }] = useDeleteOrderMutation();
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
      setError("Не удалось удалить приход. Попробуйте ещё раз.");
    }
  };

  return (
    <ConfirmDialog
      open={order !== null}
      title="Вы уверены, что хотите удалить этот приход?"
      confirmLabel="Удалить"
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
              {order.productsCount} {pluralize(order.productsCount, PRODUCT_FORMS).toLowerCase()} ·{" "}
              {formatLongDate(order.date)}
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
