import { afterEach, describe, expect, it, vi } from "vitest";
import type { StatsResponse } from "./stats-protocol";

type FakeScope = {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage: ReturnType<typeof vi.fn<(message: StatsResponse) => void>>;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function loadWorker() {
  const scope: FakeScope = { onmessage: null, postMessage: vi.fn() };
  vi.stubGlobal("self", scope);
  await import("./stats.worker");
  return scope;
}

describe("stats worker", () => {
  it("answers with stats for the request id", async () => {
    const scope = await loadWorker();

    scope.onmessage?.({ data: { id: 3, orders: [], products: [] } });

    expect(scope.postMessage).toHaveBeenCalledWith({
      id: 3,
      stats: expect.objectContaining({ ordersCount: 0, productsCount: 0 }),
    });
  });

  it("reports an error instead of crashing on bad input", async () => {
    const scope = await loadWorker();

    scope.onmessage?.({ data: { id: 4, orders: null, products: [] } });

    expect(scope.postMessage).toHaveBeenCalledWith({ id: 4, error: expect.any(String) });
  });
});
