"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "use-intl";
import type { z } from "zod";
import { Dialog, DialogError, DialogFooter } from "@/components/ui/Dialog";
import {
  createProductFormSchema,
  toCreateProductPayload,
  todayInputValue,
  type ProductFormSchema,
  type ProductFormValues,
} from "@/lib/schemas";
import { useApiErrorParser } from "@/lib/use-api-error";
import { IMAGE_TYPES, checkImageFile } from "@/lib/image-files";
import { useSchema } from "@/lib/use-schema";
import {
  useCreateProductMutation,
  useGetProductTypesQuery,
  useUploadProductPhotoMutation,
} from "@/store/api";
import { ProductFormFields, showProductApiError } from "./ProductFormFields";
import { ProductThumb } from "./ProductThumb";

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
  const [uploadPhoto] = useUploadProductPhotoMutation();
  const [photo, setPhotoState] = useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState<string | null>(null);
  const { data: types } = useGetProductTypesQuery(undefined, { skip: !open });
  const t = useTranslations("products.create");
  const tc = useTranslations("common");
  const parseError = useApiErrorParser();
  const schema = useSchema(createProductFormSchema);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, z.output<ProductFormSchema>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) reset({ ...EMPTY_VALUES, guaranteeStart: todayInputValue() });
  }, [open, reset]);

  const setPhoto = (file: File | null) =>
    setPhotoState(file ? { file, url: URL.createObjectURL(file) } : null);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  const close = () => {
    setPhoto(null);
    setPhotoError(null);
    setPhotoFailed(null);
    onClose();
  };

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setPhotoError(problem === "type" ? t("photoType") : t("photoSize"));
      return;
    }
    setPhotoError(null);
    setPhoto(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!order) return;
    try {
      const product = await createProduct(toCreateProductPayload(values, order.id)).unwrap();
      if (photo) {
        try {
          await uploadPhoto({ id: product.id, orderId: order.id, file: photo.file }).unwrap();
        } catch (error) {
          setPhotoFailed(parseError(error, t("photoUploadError")).message);
          return;
        }
      }
      close();
    } catch (error) {
      showProductApiError(parseError(error, t("error")), setError, t("duplicateSerial"));
    }
  });

  const watchedType = useWatch({ control, name: "type" });

  return (
    <Dialog
      open={open}
      title={order ? t("titleFor", { order: order.title }) : t("title")}
      size="lg"
      locked={isSubmitting}
      onClose={close}
    >
      <form className="dialog__form" noValidate onSubmit={onSubmit}>
        <div className="dialog__body dialog__body--padded">
          <div className="form">
            <ProductFormFields register={register} errors={errors} types={types?.items} />

            <div className="form__field form__field--wide">
              <span className="form__label">{t("photo")}</span>
              <div className="form__photo">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="form__photo-preview" src={photo.url} alt="" />
                ) : (
                  <ProductThumb src={null} type={watchedType} alt="" />
                )}
                <label className="form__photo-pick">
                  <input
                    type="file"
                    accept={IMAGE_TYPES.join(",")}
                    className="visually-hidden"
                    onChange={onPhotoChange}
                  />
                  <i className="bi bi-image" aria-hidden="true" />
                  {photo ? t("photoReplace") : t("photoPick")}
                </label>
                {photo && (
                  <button
                    type="button"
                    className="form__photo-clear"
                    onClick={() => setPhoto(null)}
                  >
                    {t("photoClear")}
                  </button>
                )}
              </div>
              <div
                className={photoError ? "form__error" : "form__hint"}
                role={photoError ? "alert" : undefined}
              >
                {photoError ?? t("photoHint")}
              </div>
            </div>
          </div>
        </div>
        <DialogError
          message={photoFailed ? t("photoSaved", { reason: photoFailed }) : errors.root?.message}
        />
        {photoFailed ? (
          <div className="dialog__footer">
            <button type="button" className="dialog__action" onClick={close}>
              {tc("close")}
            </button>
          </div>
        ) : (
          <DialogFooter disabled={isSubmitting} onCancel={close}>
            <button type="submit" className="dialog__action" disabled={isSubmitting}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
              {isSubmitting ? tc("saving") : t("submit")}
            </button>
          </DialogFooter>
        )}
      </form>
    </Dialog>
  );
}
