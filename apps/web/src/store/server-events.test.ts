import { describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { makeStore } from "./index";
import { serverEventReceived, tagsForEvent } from "./server-events";

const at = "2026-01-01T00:00:00.000Z";

describe("tagsForEvent", () => {
  it("refreshes only the order list for a new order", () => {
    expect(tagsForEvent({ type: "order.created", orderId: 1, occurredAt: at })).toEqual([
      { type: "Order", id: "LIST" },
    ]);
  });

  it("refreshes the product, its order and all lists when a product is deleted", () => {
    expect(
      tagsForEvent({ type: "product.deleted", productId: 5, orderId: 2, occurredAt: at }),
    ).toEqual([
      { type: "Product", id: 5 },
      { type: "Order", id: 2 },
      { type: "Order", id: "LIST" },
      { type: "Product", id: "LIST" },
      { type: "Product", id: "TYPES" },
    ]);
  });
});

describe("server events middleware", () => {
  it("invalidates cache tags when an event arrives", () => {
    const spy = vi.spyOn(api.util, "invalidateTags");
    const store = makeStore();

    store.dispatch(serverEventReceived({ type: "order.deleted", orderId: 9, occurredAt: at }));

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        { type: "Order", id: 9 },
        { type: "Order", id: "LIST" },
      ]),
    );
    spy.mockRestore();
  });
});
