import type { DashboardStats } from "@/lib/stats";
import type { OrderSummary, Product } from "@/types/api";

export type StatsRequest = { id: number; orders: OrderSummary[]; products: Product[] };

export type StatsResponse = { id: number; stats: DashboardStats } | { id: number; error: string };
