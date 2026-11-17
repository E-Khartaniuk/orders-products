"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DeleteProductDialog } from "@/components/products/DeleteProductDialog";
import { ProductLine } from "@/components/products/ProductLine";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useGetOrderQuery } from "@/store/api";
import type { Product } from "@/types/api";

export function OrderDetailsPanel() {
  const params = useParams<{ id: string }>();
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

  const notFound = isError && "status" in error && error.status === 404;

  return (
    <div className="order-details">
      <Link href="/orders" scroll={false} className="order-details__close" aria-label="Закрыть">
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
            message={notFound ? "Приход не найден" : "Не удалось загрузить приход"}
            onRetry={notFound ? undefined : refetch}
          />
        </div>
      )}

      {order && (
        <>
          <header className="order-details__header">
            <h2 className="order-details__title">{order.title}</h2>
            <button type="button" className="order-details__add">
              <i className="bi bi-plus-circle-fill" aria-hidden="true" />
              Добавить продукт
            </button>
          </header>
          {order.products.length === 0 ? (
            <p className="order-details__empty">В этом приходе пока нет продуктов</p>
          ) : (
            <ul className="order-details__list">
              {order.products.map((product) => (
                <ProductLine key={product.id} product={product} onDelete={setProductToDelete} />
              ))}
            </ul>
          )}
        </>
      )}

      <DeleteProductDialog product={productToDelete} onClose={closeDialog} />
    </div>
  );
}
