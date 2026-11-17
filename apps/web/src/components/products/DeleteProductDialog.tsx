"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteProductMutation } from "@/store/api";
import type { Product } from "@/types/api";
import { ProductLine } from "./ProductLine";

type DeleteProductDialogProps = {
  product: Product | null;
  onClose: () => void;
};

export function DeleteProductDialog({ product, onClose }: DeleteProductDialogProps) {
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const confirm = async () => {
    if (!product) return;
    try {
      await deleteProduct({ id: product.id, orderId: product.order.id }).unwrap();
      close();
    } catch {
      setError("Не удалось удалить продукт. Попробуйте ещё раз.");
    }
  };

  return (
    <ConfirmDialog
      open={product !== null}
      title="Вы уверены, что хотите удалить этот продукт?"
      confirmLabel="Удалить"
      pending={isLoading}
      error={error}
      onConfirm={confirm}
      onClose={close}
    >
      {product && <ProductLine product={product} as="div" />}
    </ConfirmDialog>
  );
}
