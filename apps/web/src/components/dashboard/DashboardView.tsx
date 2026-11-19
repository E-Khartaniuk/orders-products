"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "use-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList, StateMessage } from "@/components/ui/StateMessage";
import { useDocumentTitle } from "@/i18n/use-document-title";
import { formatAmount } from "@/lib/format";
import { useGetOrdersQuery, useGetProductsQuery } from "@/store/api";
import { useStatsWorker } from "@/workers/use-stats-worker";
import { ChartCard } from "./ChartCard";

const chartFallback = () => <div className="skeleton chart-card__placeholder" />;

const CountBarChart = dynamic(() => import("./CountBarChart"), {
  ssr: false,
  loading: chartFallback,
});
const MonthlyValueChart = dynamic(() => import("./MonthlyValueChart"), {
  ssr: false,
  loading: chartFallback,
});
const OrdersMap = dynamic(() => import("./OrdersMap"), {
  ssr: false,
  loading: chartFallback,
});

export function DashboardView() {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  useDocumentTitle(t("title"));

  const orders = useGetOrdersQuery();
  const products = useGetProductsQuery();
  const stats = useStatsWorker(orders.data?.items, products.data?.items);

  const isError = orders.isError || products.isError;
  const retry = () => {
    if (orders.isError) orders.refetch();
    if (products.isError) products.refetch();
  };

  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <>
      <PageHeader title={t("title")} />

      {isError && <StateMessage variant="error" message={t("loadError")} onRetry={retry} />}
      {!isError && !stats && <SkeletonList count={4} height={120} />}

      {stats && (
        <div className="dashboard">
          <dl className="dashboard__kpis">
            <div className="kpi">
              <dt className="kpi__label">{t("kpi.orders")}</dt>
              <dd className="kpi__value">{stats.ordersCount}</dd>
            </div>
            <div className="kpi">
              <dt className="kpi__label">{t("kpi.products")}</dt>
              <dd className="kpi__value">{stats.productsCount}</dd>
            </div>
            <div className="kpi">
              <dt className="kpi__label">{t("kpi.value")}</dt>
              <dd className="kpi__value">
                {formatAmount(Math.round(stats.totalValue), locale)}{" "}
                <span className="kpi__unit">UAH</span>
              </dd>
            </div>
            <div className="kpi">
              <dt className="kpi__label">{t("kpi.inUse")}</dt>
              <dd className="kpi__value">{percent.format(stats.inUseShare)}</dd>
            </div>
          </dl>

          <ChartCard
            title={t("byStatus")}
            columns={[t("columns.status"), t("columns.count")]}
            rows={stats.byStatus.map((item) => [tStatus(item.key), item.count])}
          >
            <CountBarChart
              data={stats.byStatus.map((item) => ({ label: tStatus(item.key), count: item.count }))}
              countLabel={t("columns.count")}
            />
          </ChartCard>

          <ChartCard
            title={t("byType")}
            columns={[t("columns.type"), t("columns.count")]}
            rows={stats.byType.map((item) => [item.key, item.count])}
          >
            <CountBarChart
              data={stats.byType.map((item) => ({ label: item.key, count: item.count }))}
              countLabel={t("columns.count")}
            />
          </ChartCard>

          <ChartCard
            title={t("byMonth")}
            wide
            columns={[t("columns.month"), t("columns.value")]}
            rows={stats.byMonth.map((item) => [item.month, formatAmount(item.value, locale)])}
          >
            <MonthlyValueChart data={stats.byMonth} valueLabel={t("columns.value")} />
          </ChartCard>

          <ChartCard
            title={t("map")}
            wide
            note={
              stats.withoutLocation > 0
                ? t("withoutLocation", { count: stats.withoutLocation })
                : undefined
            }
          >
            <OrdersMap points={stats.points} />
          </ChartCard>
        </div>
      )}
    </>
  );
}
