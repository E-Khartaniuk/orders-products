import type { OrderSummary, Product, ProductStatus } from "@/types/api";

export const STATUS_ORDER: ProductStatus[] = ["FREE", "IN_USE", "IN_REPAIR"];

export type CountDatum<K extends string = string> = { key: K; count: number };

export type MonthDatum = { month: string; value: number };

export type OrderPoint = {
  id: number;
  title: string;
  city: string;
  latitude: number;
  longitude: number;
  productsCount: number;
};

export type DashboardStats = {
  ordersCount: number;
  productsCount: number;
  totalValue: number;
  inUseShare: number;
  byStatus: CountDatum<ProductStatus>[];
  byType: CountDatum[];
  byMonth: MonthDatum[];
  points: OrderPoint[];
  withoutLocation: number;
};

const MONTHS_SHOWN = 12;

const defaultValue = (order: OrderSummary) =>
  order.totals.find((total) => total.isDefault)?.value ?? 0;

const monthKey = (iso: string) => iso.slice(0, 7);

export function computeStats(orders: OrderSummary[], products: Product[]): DashboardStats {
  const statusCounts = new Map<ProductStatus, number>(STATUS_ORDER.map((status) => [status, 0]));
  const typeCounts = new Map<string, number>();
  for (const product of products) {
    statusCounts.set(product.status, (statusCounts.get(product.status) ?? 0) + 1);
    typeCounts.set(product.type, (typeCounts.get(product.type) ?? 0) + 1);
  }

  const monthTotals = new Map<string, number>();
  const points: OrderPoint[] = [];
  let totalValue = 0;
  for (const order of orders) {
    const value = defaultValue(order);
    totalValue += value;
    const key = monthKey(order.date);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + value);
    if (order.location) {
      points.push({
        id: order.id,
        title: order.title,
        productsCount: order.productsCount,
        ...order.location,
      });
    }
  }

  const byMonth = [...monthTotals]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MONTHS_SHOWN)
    .map(([month, value]) => ({ month, value: Math.round(value * 100) / 100 }));

  return {
    ordersCount: orders.length,
    productsCount: products.length,
    totalValue: Math.round(totalValue * 100) / 100,
    inUseShare: products.length ? (statusCounts.get("IN_USE") ?? 0) / products.length : 0,
    byStatus: STATUS_ORDER.map((key) => ({ key, count: statusCounts.get(key) ?? 0 })),
    byType: [...typeCounts]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    byMonth,
    points,
    withoutLocation: orders.length - points.length,
  };
}
