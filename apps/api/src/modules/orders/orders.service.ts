import { prisma } from "../../db.js";
import { publish } from "../../events/bus.js";
import { HttpError } from "../../lib/http-error.js";
import { removeStoredImage } from "../../lib/uploads.js";
import { sumByCurrency, type PriceLike } from "../../lib/money.js";
import { productInclude, toProductDto } from "../products/products.mapper.js";
import type {
  CreateOrderBody,
  ListOrdersQuery,
  OrderLocation,
  UpdateOrderBody,
} from "./orders.schemas.js";

const summaryInclude = {
  products: { select: { prices: { select: { value: true, symbol: true, isDefault: true } } } },
} as const;

type OrderRecord = {
  id: number;
  title: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  products: { prices: PriceLike[] }[];
};

function toLocation(order: OrderRecord): OrderLocation | null {
  if (order.city == null || order.latitude == null || order.longitude == null) return null;
  return { city: order.city, latitude: order.latitude, longitude: order.longitude };
}

function toLocationColumns(location: OrderLocation | null | undefined) {
  if (location === undefined) return {};
  return {
    city: location?.city ?? null,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
}

function toOrderSummary(order: OrderRecord) {
  return {
    id: order.id,
    title: order.title,
    description: order.description,
    date: order.date,
    createdAt: order.createdAt,
    location: toLocation(order),
    productsCount: order.products.length,
    totals: sumByCurrency(order.products.flatMap((product) => product.prices)),
  };
}

export type OrderSummaryDto = ReturnType<typeof toOrderSummary>;

export async function listOrders(query: ListOrdersQuery) {
  const orders = await prisma.order.findMany({
    where: query.search ? { title: { contains: query.search } } : undefined,
    include: summaryInclude,
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return orders.map(toOrderSummary);
}

export async function getOrder(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { products: { include: productInclude, orderBy: { id: "asc" } } },
  });
  if (!order) throw HttpError.notFound("Order", id);

  return {
    ...toOrderSummary(order),
    products: order.products.map(toProductDto),
  };
}

export async function createOrder(input: CreateOrderBody) {
  const order = await prisma.order.create({
    data: {
      title: input.title,
      description: input.description,
      date: input.date ?? new Date(),
      ...toLocationColumns(input.location),
    },
    include: summaryInclude,
  });

  publish({ type: "order.created", orderId: order.id });
  return toOrderSummary(order);
}

export async function updateOrder(id: number, input: UpdateOrderBody) {
  const { location, ...data } = input;
  const order = await prisma.order.update({
    where: { id },
    data: { ...data, ...toLocationColumns(location) },
    include: summaryInclude,
  });
  publish({ type: "order.updated", orderId: order.id });
  return toOrderSummary(order);
}

export async function deleteOrder(id: number) {
  const photos = await prisma.product.findMany({
    where: { orderId: id, photo: { not: null } },
    select: { photo: true },
  });
  await prisma.order.delete({ where: { id } });
  await Promise.all(photos.map((product) => removeStoredImage(product.photo)));
  publish({ type: "order.deleted", orderId: id });
}
