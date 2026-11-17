import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/lib/config";
import type { ListResponse, OrderDetails, OrderSummary, Product, ProductsQuery } from "@/types/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/api`, credentials: "include" }),
  tagTypes: ["Order", "Product"],
  endpoints: (build) => ({
    getOrders: build.query<ListResponse<OrderSummary>, { search?: string } | void>({
      query: (params) => ({ url: "/orders", params: params ?? undefined }),
      providesTags: (result) => [
        { type: "Order", id: "LIST" },
        ...(result?.items.map((order) => ({ type: "Order" as const, id: order.id })) ?? []),
      ],
    }),
    getOrder: build.query<OrderDetails, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    deleteOrder: build.mutation<void, number>({
      query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        { type: "Product", id: "LIST" },
      ],
    }),
    getProducts: build.query<ListResponse<Product>, ProductsQuery | void>({
      query: (params) => ({ url: "/products", params: params ?? undefined }),
      providesTags: (result) => [
        { type: "Product", id: "LIST" },
        ...(result?.items.map((product) => ({ type: "Product" as const, id: product.id })) ?? []),
      ],
    }),
    getProductTypes: build.query<{ items: string[] }, void>({
      query: () => "/products/types",
      providesTags: [{ type: "Product", id: "TYPES" }],
    }),
    deleteProduct: build.mutation<void, { id: number; orderId: number }>({
      query: ({ id }) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { id, orderId }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: "TYPES" },
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useDeleteOrderMutation,
  useGetProductsQuery,
  useGetProductTypesQuery,
  useDeleteProductMutation,
} = api;
