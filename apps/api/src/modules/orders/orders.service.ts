import { prisma } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import { sumByCurrency, type PriceLike } from "../../lib/money.js";
import { productInclude, toProductDto } from "../products/products.mapper.js";
import type { CreateOrderBody, ListOrdersQuery, UpdateOrderBody } from "./orders.schemas.js";

const summaryInclude = {
  products: { select: { prices: { select: { value: true, symbol: true, isDefault: true } } } },
} as const;

type OrderRecord = {
  id: number;
  title: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  products: { prices: PriceLike[] }[];
};

function toOrderSummary(order: OrderRecord) {
  return {
    id: order.id,
    title: order.title,
    description: order.description,
    date: order.date,
    createdAt: order.createdAt,
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
    data: { ...input, date: input.date ?? new Date() },
    include: summaryInclude,
  });

  return toOrderSummary(order);
}

export async function updateOrder(id: number, input: UpdateOrderBody) {
  const order = await prisma.order.update({ where: { id }, data: input, include: summaryInclude });
  return toOrderSummary(order);
}

export async function deleteOrder(id: number) {
  await prisma.order.delete({ where: { id } });
}
