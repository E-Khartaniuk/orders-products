import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsView } from "@/components/products/ProductsView";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/StateMessage";

export const metadata: Metadata = {
  title: "Продукты",
};

function ProductsFallback() {
  return (
    <>
      <PageHeader title="Продукты" />
      <SkeletonList count={6} height={50} />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsView />
    </Suspense>
  );
}
