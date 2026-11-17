import { prisma } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import { productInclude, toProductDto } from "./products.mapper.js";
import type { CreateProductBody, ListProductsQuery } from "./products.schemas.js";

export async function listProducts(query: ListProductsQuery) {
  const products = await prisma.product.findMany({
    where: {
      type: query.type,
      orderId: query.orderId,
      ...(query.search && {
        OR: [{ title: { contains: query.search } }, { serialNumber: { contains: query.search } }],
      }),
    },
    include: productInclude,
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return products.map(toProductDto);
}

export async function listProductsByOrderIds(orderIds: readonly number[]) {
  const products = await prisma.product.findMany({
    where: { orderId: { in: [...orderIds] } },
    include: productInclude,
    orderBy: { id: "asc" },
  });

  const byOrder = new Map<number, ReturnType<typeof toProductDto>[]>();
  for (const product of products) {
    const dto = toProductDto(product);
    byOrder.set(dto.order.id, [...(byOrder.get(dto.order.id) ?? []), dto]);
  }

  return orderIds.map((id) => byOrder.get(id) ?? []);
}

export async function listProductTypes() {
  const rows = await prisma.product.findMany({
    distinct: ["type"],
    select: { type: true },
    orderBy: { type: "asc" },
  });

  return rows.map((row) => row.type);
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw HttpError.notFound("Product", id);
  return toProductDto(product);
}

export async function createProduct(input: CreateProductBody) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true },
  });
  if (!order) throw new HttpError(422, `Order with id ${input.orderId} does not exist`);

  const { prices, date, ...data } = input;
  const product = await prisma.product.create({
    data: {
      ...data,
      date: date ?? new Date(),
      prices: { create: prices },
    },
    include: productInclude,
  });

  return toProductDto(product);
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
}
