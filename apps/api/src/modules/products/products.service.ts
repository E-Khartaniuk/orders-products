import { prisma } from "../../db.js";
import { publish } from "../../events/bus.js";
import { HttpError } from "../../lib/http-error.js";
import { removeStoredImage, storeImage } from "../../lib/uploads.js";
import { productInclude, toProductDto } from "./products.mapper.js";
import type {
  CreateProductBody,
  ListProductsQuery,
  ListSpecificationsQuery,
} from "./products.schemas.js";

export async function listProducts(query: ListProductsQuery) {
  const products = await prisma.product.findMany({
    where: {
      type: query.type,
      specification: query.specification,
      status: query.status,
      isNew: query.isNew,
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

export async function listProductSpecifications(query: ListSpecificationsQuery) {
  const rows = await prisma.product.findMany({
    where: { type: query.type },
    distinct: ["specification"],
    select: { specification: true },
    orderBy: { specification: "asc" },
  });

  return rows.map((row) => row.specification);
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

  publish({ type: "product.created", productId: product.id, orderId: product.orderId });
  return toProductDto(product);
}

export async function deleteProduct(id: number) {
  const product = await prisma.product.delete({
    where: { id },
    select: { id: true, orderId: true, photo: true },
  });
  await removeStoredImage(product.photo);
  publish({ type: "product.deleted", productId: product.id, orderId: product.orderId });
}

async function findPhoto(id: number) {
  const product = await prisma.product.findUnique({ where: { id }, select: { photo: true } });
  if (!product) throw HttpError.notFound("Product", id);
  return product.photo;
}

async function updatePhoto(id: number, photo: string | null) {
  const product = await prisma.product.update({
    where: { id },
    data: { photo },
    include: productInclude,
  });
  publish({ type: "product.updated", productId: product.id, orderId: product.orderId });
  return toProductDto(product);
}

export async function setProductPhoto(id: number, file: Buffer) {
  const previous = await findPhoto(id);
  const photo = await storeImage("products", String(id), file);
  const product = await updatePhoto(id, photo);
  await removeStoredImage(previous);
  return product;
}

export async function removeProductPhoto(id: number) {
  const previous = await findPhoto(id);
  const product = await updatePhoto(id, null);
  await removeStoredImage(previous);
  return product;
}
