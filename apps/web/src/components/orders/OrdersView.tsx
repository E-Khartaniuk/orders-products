"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDocumentTitle } from "@/i18n/use-document-title";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAppSelector } from "@/store";
import { useGetOrdersQuery } from "@/store/api";
import type { OrderSummary } from "@/types/api";
import { OrderRow } from "./OrderRow";

const CreateOrderDialog = dynamic(() =>
  import("./CreateOrderDialog").then((module) => module.CreateOrderDialog),
);
const DeleteOrderDialog = dynamic(() =>
  import("./DeleteOrderDialog").then((module) => module.DeleteOrderDialog),
);

export function OrdersView({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("orders");
  useDocumentTitle(t("title"));
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

  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const hasDetails = selectedId !== null;

  return (
    <>
      <PageHeader
        title={t("title")}
        total={data?.total ?? 0}
        addLabel={t("add")}
        onAdd={() => setCreateOpen(true)}
      />

      <div className={clsx("orders", hasDetails && "orders--with-details")}>
        <div>
          {isLoading && <SkeletonList count={4} height={72} />}
          {isError && <StateMessage variant="error" message={t("loadError")} onRetry={refetch} />}
          {data && data.items.length === 0 && (
            <StateMessage variant="empty" message={search ? t("nothingFound") : t("empty")} />
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
              className="orders__details"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-label={t("details")}
            >
              {children}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <DeleteOrderDialog order={orderToDelete} onClose={closeDialog} onDeleted={onDeleted} />
      <CreateOrderDialog open={createOpen} onClose={closeCreate} />
    </>
  );
}
