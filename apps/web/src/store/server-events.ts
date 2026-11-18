import { createAction, createListenerMiddleware } from "@reduxjs/toolkit";
import { api } from "./api";

export type ServerEvent = { occurredAt: string } & (
  | { type: "order.created"; orderId: number }
  | { type: "order.updated"; orderId: number }
  | { type: "order.deleted"; orderId: number }
  | { type: "product.created"; productId: number; orderId: number }
  | { type: "product.updated"; productId: number; orderId: number }
  | { type: "product.deleted"; productId: number; orderId: number }
);

type CacheTag = { type: "Order" | "Product"; id: number | "LIST" | "TYPES" };

export const serverEventReceived = createAction<ServerEvent>("server/eventReceived");

export function tagsForEvent(event: ServerEvent): CacheTag[] {
  const orderList: CacheTag = { type: "Order", id: "LIST" };
  const productLists: CacheTag[] = [
    { type: "Product", id: "LIST" },
    { type: "Product", id: "TYPES" },
  ];

  switch (event.type) {
    case "order.created":
      return [orderList];
    case "order.updated":
      return [{ type: "Order", id: event.orderId }, orderList];
    case "order.deleted":
      return [{ type: "Order", id: event.orderId }, orderList, ...productLists];
    case "product.created":
      return [{ type: "Order", id: event.orderId }, orderList, ...productLists];
    case "product.updated":
      return [
        { type: "Product", id: event.productId },
        { type: "Product", id: "LIST" },
        { type: "Order", id: event.orderId },
      ];
    case "product.deleted":
      return [
        { type: "Product", id: event.productId },
        { type: "Order", id: event.orderId },
        orderList,
        ...productLists,
      ];
  }
}

export const serverEventsMiddleware = createListenerMiddleware();

serverEventsMiddleware.startListening({
  actionCreator: serverEventReceived,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(api.util.invalidateTags(tagsForEvent(action.payload)));
  },
});
