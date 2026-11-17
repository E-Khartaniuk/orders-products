import { computeStats } from "@/lib/stats";
import type { StatsRequest, StatsResponse } from "./stats-protocol";

type WorkerScope = {
  onmessage: ((event: MessageEvent<StatsRequest>) => void) | null;
  postMessage: (message: StatsResponse) => void;
};

const scope = self as unknown as WorkerScope;

scope.onmessage = ({ data }) => {
  try {
    scope.postMessage({ id: data.id, stats: computeStats(data.orders, data.products) });
  } catch (error) {
    scope.postMessage({ id: data.id, error: error instanceof Error ? error.message : "failed" });
  }
};
