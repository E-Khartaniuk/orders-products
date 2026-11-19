"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDocumentTitle } from "@/i18n/use-document-title";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { LazyMount } from "@/components/ui/LazyMount";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAppSelector } from "@/store";
import { useGetProductsQuery } from "@/store/api";
import type { Product } from "@/types/api";
import { ProductRow } from "./ProductRow";
import { ProductTypeFilter } from "./ProductTypeFilter";

const ProductPhotoDialog = dynamic(
  () => import("./ProductPhotoDialog").then((module) => module.ProductPhotoDialog),
  { ssr: false },
);
const DeleteProductDialog = dynamic(
  () => import("./DeleteProductDialog").then((module) => module.DeleteProductDialog),
  { ssr: false },
);

export function ProductsView() {
  const t = useTranslations("products");
  useDocumentTitle(t("title"));
  const type = useAppSelector((state) => state.ui.productTypeFilter);
  const search = useDebouncedValue(useAppSelector((state) => state.ui.search).trim());

  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery({
    ...(type && { type }),
    ...(search && { search }),
  });

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const closeDialog = useCallback(() => setProductToDelete(null), []);
  const [photoProduct, setPhotoProduct] = useState<Product | null>(null);
  const closePhoto = useCallback(() => setPhotoProduct(null), []);

  const filtered = Boolean(type || search);

  return (
    <>
      <PageHeader title={t("title")} total={data?.total ?? 0}>
        <ProductTypeFilter />
      </PageHeader>

      <div className="products">
        {isLoading && <SkeletonList count={6} height={50} />}
        {isError && <StateMessage variant="error" message={t("loadError")} onRetry={refetch} />}
        {data && data.items.length === 0 && (
          <StateMessage variant="empty" message={filtered ? t("emptyFiltered") : t("empty")} />
        )}
        {data && data.items.length > 0 && (
          <div className="products__scroller" style={{ opacity: isFetching ? 0.6 : 1 }}>
            <ul className="products__list">
              {data.items.map((product) => (
                <li key={product.id} className="products__item">
                  <ProductRow
                    product={product}
                    onDelete={setProductToDelete}
                    onPhoto={setPhotoProduct}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <LazyMount when={productToDelete !== null}>
        <DeleteProductDialog product={productToDelete} onClose={closeDialog} />
      </LazyMount>
      <LazyMount when={photoProduct !== null}>
        <ProductPhotoDialog product={photoProduct} onClose={closePhoto} />
      </LazyMount>
    </>
  );
}
