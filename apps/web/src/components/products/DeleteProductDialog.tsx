"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "use-intl";
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
  const t = useTranslations("products.delete");
  const tc = useTranslations("common");
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
      setError(t("error"));
    }
  };

  return (
    <ConfirmDialog
      open={product !== null}
      title={t("title")}
      confirmLabel={tc("delete")}
      pending={isLoading}
      error={error}
      onConfirm={confirm}
      onClose={close}
    >
      {product && <ProductLine product={product} as="div" />}
    </ConfirmDialog>
  );
}
