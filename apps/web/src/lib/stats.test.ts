import { describe, expect, it } from "vitest";
import type { OrderSummary, Product } from "@/types/api";
import { computeStats } from "./stats";

const order = (id: number, date: string, uah: number, withLocation = true): OrderSummary => ({
  id,
  title: `Order ${id}`,
  description: null,
  date,
  createdAt: date,
  location: withLocation ? { city: "Kyiv", latitude: 50.45, longitude: 30.52 } : null,
  productsCount: 1,
  totals: [
    { symbol: "USD", value: uah / 40, isDefault: false },
    { symbol: "UAH", value: uah, isDefault: true },
  ],
});

const product = (id: number, type: string, status: Product["status"]) =>
  ({ id, type, status }) as Product;

describe("computeStats", () => {
  const stats = computeStats(
    [
      order(1, "2024-01-10T00:00:00.000Z", 100),
      order(2, "2024-01-20T00:00:00.000Z", 50.5),
      order(3, "2023-12-05T00:00:00.000Z", 10, false),
    ],
    [
      product(1, "Monitors", "IN_USE"),
      product(2, "Monitors", "FREE"),
      product(3, "Laptops", "IN_USE"),
      product(4, "Phones", "IN_USE"),
    ],
  );

  it("counts totals and the in-use share", () => {
    expect(stats).toMatchObject({
      ordersCount: 3,
      productsCount: 4,
      totalValue: 160.5,
      inUseShare: 0.75,
    });
  });

  it("keeps statuses in a fixed order, including empty ones", () => {
    expect(stats.byStatus).toEqual([
      { key: "FREE", count: 1 },
      { key: "IN_USE", count: 3 },
      { key: "IN_REPAIR", count: 0 },
    ]);
  });

  it("sorts types by count, then by name", () => {
    expect(stats.byType.map((item) => item.key)).toEqual(["Monitors", "Laptops", "Phones"]);
  });

  it("groups order value by month in chronological order", () => {
    expect(stats.byMonth).toEqual([
      { month: "2023-12", value: 10 },
      { month: "2024-01", value: 150.5 },
    ]);
  });

  it("collects map points only for orders with a location", () => {
    expect(stats.points.map((point) => point.id)).toEqual([1, 2]);
    expect(stats.withoutLocation).toBe(1);
  });

  it("handles empty data", () => {
    expect(computeStats([], [])).toMatchObject({ inUseShare: 0, byMonth: [], points: [] });
  });
});
