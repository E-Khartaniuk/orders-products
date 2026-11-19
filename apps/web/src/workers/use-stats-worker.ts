"use client";

import { useEffect, useRef, useState } from "react";
import { computeStats, type DashboardStats } from "@/lib/stats";
import type { OrderSummary, Product } from "@/types/api";
import type { StatsRequest, StatsResponse } from "./stats-protocol";

function createWorker() {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(new URL("./stats.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

export function useStatsWorker(orders?: OrderSummary[], products?: Product[]) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const worker = createWorker();
    workerRef.current = worker;
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!orders || !products) return;

    const id = ++requestId.current;
    const fallback = () => {
      if (id === requestId.current) setStats(computeStats(orders, products));
    };

    const worker = workerRef.current;
    if (!worker) {
      queueMicrotask(fallback);
      return;
    }

    const onMessage = ({ data }: MessageEvent<StatsResponse>) => {
      if (data.id !== id) return;
      if ("stats" in data) setStats(data.stats);
      else fallback();
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", fallback);
    worker.postMessage({ id, orders, products } satisfies StatsRequest);

    return () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", fallback);
    };
  }, [orders, products]);

  return stats;
}
