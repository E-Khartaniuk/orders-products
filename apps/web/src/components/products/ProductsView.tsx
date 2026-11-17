"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAppSelector } from "@/store";
import { useGetProductsQuery } from "@/store/api";
import type { Product } from "@/types/api";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { ProductRow } from "./ProductRow";
import { ProductTypeFilter } from "./ProductTypeFilter";

export function ProductsView() {
  const type = useAppSelector((state) => state.ui.productTypeFilter);
  const search = useDebouncedValue(useAppSelector((state) => state.ui.search).trim());

  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery({
    ...(type && { type }),
    ...(search && { search }),
  });

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const closeDialog = useCallback(() => setProductToDelete(null), []);

  const filtered = Boolean(type || search);

  return (
    <>
      <PageHeader title="Продукты" total={data?.total ?? 0}>
        <ProductTypeFilter />
      </PageHeader>

      <div className="products">
        {isLoading && <SkeletonList count={6} height={50} />}
        {isError && (
          <StateMessage
            variant="error"
            message="Не удалось загрузить продукты. Проверьте, что API запущен."
            onRetry={refetch}
          />
        )}
        {data && data.items.length === 0 && (
          <StateMessage
            variant="empty"
            message={filtered ? "Нет продуктов, подходящих под фильтр" : "Продуктов пока нет"}
          />
        )}
        {data && data.items.length > 0 && (
          <div className="products__scroller" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <ul className="products__list">
              {data.items.map((product) => (
                <li key={product.id} className="products__item">
                  <ProductRow product={product} onDelete={setProductToDelete} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DeleteProductDialog product={productToDelete} onClose={closeDialog} />
    </>
  );
}
