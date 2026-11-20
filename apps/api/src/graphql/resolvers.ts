import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { z } from "zod";
import { getMe } from "../modules/auth/auth.service.js";
import { createOrderBody, listOrdersQuery } from "../modules/orders/orders.schemas.js";
import * as ordersService from "../modules/orders/orders.service.js";
import type { ProductDto } from "../modules/products/products.mapper.js";
import {
  createProductBody,
  listProductsQuery,
  listSpecificationsQuery,
} from "../modules/products/products.schemas.js";
import * as productsService from "../modules/products/products.service.js";
import type { GraphqlContext } from "./context.js";

const idSchema = z.coerce.number().int().positive();

const parseDate = (value: unknown) => {
  const date = new Date(value as string);
  if (typeof value !== "string" || Number.isNaN(date.getTime())) {
    throw new GraphQLError("DateTime must be an ISO-8601 string", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return date;
};

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string",
  serialize: (value) => (value instanceof Date ? value.toISOString() : String(value)),
  parseValue: parseDate,
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? parseDate(ast.value) : null),
});

type OrderParent = { id: number; products?: ProductDto[] };

const withoutNulls = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== null)) as {
    [K in keyof T]: Exclude<T[K], null>;
  };

export const resolvers = {
  DateTime,

  Query: {
    me: (_: unknown, __: unknown, ctx: GraphqlContext) => getMe(ctx.auth.userId),

    orders: (_: unknown, args: { search?: string | null }) =>
      ordersService.listOrders(listOrdersQuery.parse(withoutNulls(args))),

    order: async (_: unknown, args: { id: string }) => {
      const id = idSchema.parse(args.id);
      try {
        return await ordersService.getOrder(id);
      } catch (error) {
        if ((error as { status?: number }).status === 404) return null;
        throw error;
      }
    },

    products: (
      _: unknown,
      args: {
        type?: string | null;
        specification?: string | null;
        status?: string | null;
        isNew?: boolean | null;
        search?: string | null;
        orderId?: string | null;
      },
    ) => productsService.listProducts(listProductsQuery.parse(withoutNulls(args))),

    productTypes: () => productsService.listProductTypes(),

    productSpecifications: (_: unknown, args: { type?: string | null }) =>
      productsService.listProductSpecifications(listSpecificationsQuery.parse(withoutNulls(args))),
  },

  Mutation: {
    createOrder: (_: unknown, args: { input: Record<string, unknown> }) =>
      ordersService.createOrder(createOrderBody.parse(withoutNulls(args.input))),

    deleteOrder: async (_: unknown, args: { id: string }) => {
      await ordersService.deleteOrder(idSchema.parse(args.id));
      return true;
    },

    createProduct: (_: unknown, args: { input: Record<string, unknown> }) => {
      const input = withoutNulls(args.input);
      return productsService.createProduct(
        createProductBody.parse({ ...input, orderId: idSchema.parse(input.orderId) }),
      );
    },

    deleteProduct: async (_: unknown, args: { id: string }) => {
      await productsService.deleteProduct(idSchema.parse(args.id));
      return true;
    },
  },

  Order: {
    products: (parent: OrderParent, _: unknown, ctx: GraphqlContext) =>
      parent.products ?? ctx.loaders.productsByOrderId.load(parent.id),
  },
};
