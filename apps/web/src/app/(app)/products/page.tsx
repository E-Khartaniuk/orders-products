import { Suspense } from "react";
import { ProductsFallback } from "@/components/products/ProductsFallback";
import { ProductsView } from "@/components/products/ProductsView";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsView />
    </Suspense>
  );
}
