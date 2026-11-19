import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { OrderDetails, Product } from "@/types/api";

type GraphqlError = { message: string; extensions?: { code?: string; details?: unknown } };

export type GraphqlResponse<T> = { data?: T | null; errors?: GraphqlError[] };

const STATUS_BY_CODE: Record<string, number> = {
  BAD_USER_INPUT: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function graphqlRequest(query: string, variables?: Record<string, unknown>): FetchArgs {
  return { url: "/graphql", method: "POST", body: { query, variables } };
}

export function graphqlErrorToFetchError(error: GraphqlError): FetchBaseQueryError {
  const code = error.extensions?.code ?? "INTERNAL_SERVER_ERROR";
  return {
    status: STATUS_BY_CODE[code] ?? 500,
    data: { error: { message: error.message, details: error.extensions?.details } },
  };
}

export const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    serialNumber
    isNew
    photo
    title
    type
    specification
    status
    guarantee {
      start
      end
    }
    date
    prices {
      symbol
      value
      isDefault
    }
    order {
      id
      title
    }
    group {
      id
      title
    }
    user {
      id
      name
    }
  }
`;

export const ORDER_DETAILS_QUERY = /* GraphQL */ `
  query OrderDetails($id: ID!) {
    order(id: $id) {
      id
      title
      description
      date
      createdAt
      location {
        city
        latitude
        longitude
      }
      productsCount
      totals {
        symbol
        value
        isDefault
      }
      products {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

type GqlId = { id: string };
type Gql<T extends { id: number }> = Omit<T, "id"> & GqlId;

export type GqlProduct = Omit<Gql<Product>, "order" | "group" | "user"> & {
  order: Gql<Product["order"]>;
  group: Gql<NonNullable<Product["group"]>> | null;
  user: Gql<NonNullable<Product["user"]>> | null;
};

export type GqlOrderDetails = Omit<Gql<OrderDetails>, "products"> & { products: GqlProduct[] };

const withNumberId = <T extends GqlId>(ref: T) => ({ ...ref, id: Number(ref.id) });

export function normalizeProduct(product: GqlProduct): Product {
  return {
    ...product,
    id: Number(product.id),
    order: withNumberId(product.order),
    group: product.group && withNumberId(product.group),
    user: product.user && withNumberId(product.user),
  };
}

export function normalizeOrderDetails(order: GqlOrderDetails): OrderDetails {
  return {
    ...order,
    id: Number(order.id),
    products: order.products.map(normalizeProduct),
  };
}

export type OrderDetailsResponse = GraphqlResponse<{ order: GqlOrderDetails | null }>;
