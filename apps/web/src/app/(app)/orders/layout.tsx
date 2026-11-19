import { Suspense } from "react";
import { OrdersFallback } from "@/components/orders/OrdersFallback";
import { OrdersView } from "@/components/orders/OrdersView";

export default function OrdersLayout({ children }: LayoutProps<"/orders">) {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersView>{children}</OrdersView>
    </Suspense>
  );
}
