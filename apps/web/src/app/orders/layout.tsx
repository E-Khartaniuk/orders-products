import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersView } from "@/components/orders/OrdersView";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/StateMessage";

export const metadata: Metadata = {
  title: "Приходы",
};

function OrdersFallback() {
  return (
    <>
      <PageHeader title="Приходы" addLabel="Добавить приход" />
      <div className="orders">
        <SkeletonList count={4} height={72} />
      </div>
    </>
  );
}

export default function OrdersLayout({ children }: LayoutProps<"/orders">) {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersView>{children}</OrdersView>
    </Suspense>
  );
}
