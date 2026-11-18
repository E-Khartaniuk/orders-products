"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "use-intl";
import { Dialog, DialogError } from "@/components/ui/Dialog";
import { AVATAR_TYPES, checkAvatarFile } from "@/lib/profile-schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { useDeleteProductPhotoMutation, useUploadProductPhotoMutation } from "@/store/api";
import type { Product } from "@/types/api";
import { ProductThumb } from "./ProductThumb";

type ProductPhotoDialogProps = {
  product: Product | null;
  onClose: () => void;
};

export function ProductPhotoDialog({ product, onClose }: ProductPhotoDialogProps) {
  const t = useTranslations("products.photo");
  const tc = useTranslations("common");
  const parseError = useApiErrorParser();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Product | null>(null);

  const [uploadPhoto, { isLoading: uploading }] = useUploadProductPhotoMutation();
  const [deletePhoto, { isLoading: deleting }] = useDeleteProductPhotoMutation();
  const busy = uploading || deleting;

  const shown = current && product && current.id === product.id ? current : product;

  const close = useCallback(() => {
    setError(null);
    setCurrent(null);
    onClose();
  }, [onClose]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !product) return;

    const problem = checkAvatarFile(file);
    if (problem) {
      setError(problem === "type" ? t("type") : t("size"));
      return;
    }

    setError(null);
    try {
      setCurrent(await uploadPhoto({ id: product.id, orderId: product.order.id, file }).unwrap());
    } catch (caught) {
      setError(parseError(caught, t("error")).message);
    }
  };

  const onRemove = async () => {
    if (!product) return;
    setError(null);
    try {
      setCurrent(await deletePhoto({ id: product.id, orderId: product.order.id }).unwrap());
    } catch (caught) {
      setError(parseError(caught, t("error")).message);
    }
  };

  return (
    <Dialog open={product !== null} title={t("title")} locked={busy} onClose={close}>
      {shown && (
        <div className="dialog__body dialog__body--padded product-photo">
          <ProductThumb src={shown.photo} type={shown.type} alt={shown.title} size="lg" />
          <p className="product-photo__name">{shown.title}</p>
          <p className="product-photo__hint">{t("hint")}</p>
        </div>
      )}
      <DialogError message={error} />
      <div className="dialog__footer">
        <input
          ref={fileInput}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFileChange}
        />
        {shown?.photo && (
          <button type="button" className="dialog__cancel" onClick={onRemove} disabled={busy}>
            {deleting ? tc("deleting") : t("remove")}
          </button>
        )}
        <button
          type="button"
          className="dialog__action"
          data-autofocus
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <i className="bi bi-upload" aria-hidden="true" />
          {uploading ? t("uploading") : shown?.photo ? t("replace") : t("upload")}
        </button>
      </div>
    </Dialog>
  );
}
