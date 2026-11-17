"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAppSelector } from "@/store";
import { useGetOrdersQuery } from "@/store/api";
import type { OrderSummary } from "@/types/api";
import { DeleteOrderDialog } from "./DeleteOrderDialog";
import { OrderRow } from "./OrderRow";

export function OrdersView({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const selectedId = params.id ? Number(params.id) : null;

  const search = useDebouncedValue(useAppSelector((state) => state.ui.search).trim());
  const { data, isLoading, isError, refetch } = useGetOrdersQuery(search ? { search } : undefined);

  const [orderToDelete, setOrderToDelete] = useState<OrderSummary | null>(null);
  const closeDialog = useCallback(() => setOrderToDelete(null), []);
  const onDeleted = useCallback(
    (order: OrderSummary) => {
      if (order.id === selectedId) router.push("/orders", { scroll: false });
    },
    [router, selectedId],
  );

  const hasDetails = selectedId !== null;

  return (
    <>
      <PageHeader title="Приходы" total={data?.total ?? 0} addLabel="Добавить приход" />

      <div className={clsx("orders", hasDetails && "orders--with-details")}>
        <div>
          {isLoading && <SkeletonList count={4} height={72} />}
          {isError && (
            <StateMessage
              variant="error"
              message="Не удалось загрузить приходы. Проверьте, что API запущен."
              onRetry={refetch}
            />
          )}
          {data && data.items.length === 0 && (
            <StateMessage
              variant="empty"
              message={search ? "По вашему запросу ничего не найдено" : "Приходов пока нет"}
            />
          )}
          {data && data.items.length > 0 && (
            <motion.ul className="orders__list" layout>
              <AnimatePresence initial={false}>
                {data.items.map((order) => (
                  <motion.li
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OrderRow
                      order={order}
                      compact={hasDetails}
                      active={order.id === selectedId}
                      onDelete={setOrderToDelete}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>

        {!hasDetails && children}
        <AnimatePresence mode="wait">
          {hasDetails && (
            <motion.section
              key={selectedId}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-label="Детали прихода"
            >
              {children}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <DeleteOrderDialog order={orderToDelete} onClose={closeDialog} onDeleted={onDeleted} />
    </>
  );
}
