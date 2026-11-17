import { createApi } from "@reduxjs/toolkit/query/react";
import {
  ORDER_DETAILS_QUERY,
  graphqlErrorToFetchError,
  graphqlRequest,
  normalizeOrderDetails,
  type OrderDetailsResponse,
} from "@/lib/graphql";
import type { CreateOrderPayload, CreateProductPayload } from "@/lib/schemas";
import type {
  AuthResponse,
  ListResponse,
  LoginPayload,
  OrderDetails,
  OrderSummary,
  Product,
  ProductsQuery,
  RegisterPayload,
  User,
} from "@/types/api";
import { credentialsReceived, loggedOut, userUpdated } from "./auth-slice";
import { baseQueryWithReauth } from "./base-query";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Order", "Product"],
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(credentialsReceived(data));
      },
    }),
    register: build.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(credentialsReceived(data));
      },
    }),
    restoreSession: build.mutation<AuthResponse, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        dispatch(data ? credentialsReceived(data) : loggedOut());
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(loggedOut());
        dispatch(api.util.resetApiState());
      },
    }),
    updateProfile: build.mutation<{ user: User }, { name: string }>({
      query: (body) => ({ url: "/profile", method: "PATCH", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(userUpdated(data.user));
      },
    }),
    uploadAvatar: build.mutation<{ user: User }, File>({
      query: (file) => {
        const body = new FormData();
        body.append("avatar", file);
        return { url: "/profile/avatar", method: "PUT", body };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(userUpdated(data.user));
      },
    }),
    deleteAvatar: build.mutation<{ user: User }, void>({
      query: () => ({ url: "/profile/avatar", method: "DELETE" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(userUpdated(data.user));
      },
    }),
    changePassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/password", method: "PUT", body }),
    }),
    getOrders: build.query<ListResponse<OrderSummary>, { search?: string } | void>({
      query: (params) => ({ url: "/orders", params: params ?? undefined }),
      providesTags: (result) => [
        { type: "Order", id: "LIST" },
        ...(result?.items.map((order) => ({ type: "Order" as const, id: order.id })) ?? []),
      ],
    }),
    getOrder: build.query<OrderDetails, number>({
      async queryFn(id, _api, _extra, baseQuery) {
        const result = await baseQuery(graphqlRequest(ORDER_DETAILS_QUERY, { id: String(id) }));
        if (result.error) return { error: result.error };

        const body = result.data as OrderDetailsResponse;
        if (body.errors?.length) return { error: graphqlErrorToFetchError(body.errors[0]) };
        if (!body.data?.order) {
          return {
            error: graphqlErrorToFetchError({
              message: `Order with id ${id} not found`,
              extensions: { code: "NOT_FOUND" },
            }),
          };
        }

        return { data: normalizeOrderDetails(body.data.order) };
      },
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    createOrder: build.mutation<OrderSummary, CreateOrderPayload>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
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
    createProduct: build.mutation<Product, CreateProductPayload>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: "TYPES" },
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
      ],
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
  useCreateOrderMutation,
  useDeleteOrderMutation,
  useGetProductsQuery,
  useGetProductTypesQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
  useLoginMutation,
  useRegisterMutation,
  useRestoreSessionMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useChangePasswordMutation,
} = api;
