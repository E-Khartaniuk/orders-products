"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "use-intl";
import { ProductLine } from "@/components/products/ProductLine";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useGetOrderQuery } from "@/store/api";
import type { Product } from "@/types/api";

const AddProductDialog = dynamic(() =>
  import("@/components/products/AddProductDialog").then((module) => module.AddProductDialog),
);
const ProductPhotoDialog = dynamic(() =>
  import("@/components/products/ProductPhotoDialog").then((module) => module.ProductPhotoDialog),
);
const DeleteProductDialog = dynamic(() =>
  import("@/components/products/DeleteProductDialog").then((module) => module.DeleteProductDialog),
);

export function OrderDetailsPanel() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const id = Number(params.id);
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetOrderQuery(id, {
    skip: !Number.isInteger(id) || id <= 0,
  });

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const closeDialog = useCallback(() => setProductToDelete(null), []);
  const [photoProduct, setPhotoProduct] = useState<Product | null>(null);
  const closePhoto = useCallback(() => setPhotoProduct(null), []);
  const [addOpen, setAddOpen] = useState(false);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const notFound = isError && "status" in error && error.status === 404;

  return (
    <div className="order-details">
      <Link href="/orders" scroll={false} className="order-details__close" aria-label={tc("close")}>
        <i className="bi bi-x-lg" aria-hidden="true" />
      </Link>

      {isLoading && (
        <div className="p-4">
          <SkeletonList count={5} height={48} />
        </div>
      )}

      {isError && (
        <div className="p-4">
          <StateMessage
            variant="error"
            message={notFound ? t("notFound") : t("loadOneError")}
            onRetry={notFound ? undefined : refetch}
          />
        </div>
      )}

      {order && (
        <>
          <header className="order-details__header">
            <h2 className="order-details__title">{order.title}</h2>
            <button type="button" className="order-details__add" onClick={() => setAddOpen(true)}>
              <i className="bi bi-plus-circle-fill" aria-hidden="true" />
              {t("addProduct")}
            </button>
          </header>
          {order.products.length === 0 ? (
            <p className="order-details__empty">{t("noProducts")}</p>
          ) : (
            <ul className="order-details__list">
              {order.products.map((product) => (
                <ProductLine
                  key={product.id}
                  product={product}
                  onDelete={setProductToDelete}
                  onPhoto={setPhotoProduct}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <DeleteProductDialog product={productToDelete} onClose={closeDialog} />
      <ProductPhotoDialog product={photoProduct} onClose={closePhoto} />
      <AddProductDialog
        order={addOpen && order ? { id: order.id, title: order.title } : null}
        onClose={closeAdd}
      />
    </div>
  );
}
