import { EventEmitter } from "node:events";

export type DomainEventPayload =
  | { type: "order.created"; orderId: number }
  | { type: "order.updated"; orderId: number }
  | { type: "order.deleted"; orderId: number }
  | { type: "product.created"; productId: number; orderId: number }
  | { type: "product.deleted"; productId: number; orderId: number };

export type DomainEvent = DomainEventPayload & { occurredAt: string };

type Handler = (event: DomainEvent) => void;

const CHANNEL = "domain-event";
const emitter = new EventEmitter();

export function publish(payload: DomainEventPayload) {
  const event: DomainEvent = { ...payload, occurredAt: new Date().toISOString() };
  for (const handler of emitter.listeners(CHANNEL) as Handler[]) {
    try {
      handler(event);
    } catch (error) {
      console.error(`Domain event handler failed for ${event.type}`, error);
    }
  }
}

export function subscribe(handler: Handler) {
  emitter.on(CHANNEL, handler);
  return () => {
    emitter.off(CHANNEL, handler);
  };
}
