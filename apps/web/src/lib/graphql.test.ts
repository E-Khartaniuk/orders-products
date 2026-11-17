import { describe, expect, it } from "vitest";
import {
  graphqlErrorToFetchError,
  graphqlRequest,
  normalizeOrderDetails,
  type GqlOrderDetails,
} from "./graphql";

describe("graphqlRequest", () => {
  it("builds a POST request to /graphql", () => {
    expect(graphqlRequest("{ me { id } }", { a: 1 })).toEqual({
      url: "/graphql",
      method: "POST",
      body: { query: "{ me { id } }", variables: { a: 1 } },
    });
  });
});

describe("graphqlErrorToFetchError", () => {
  it.each([
    ["UNAUTHENTICATED", 401],
    ["NOT_FOUND", 404],
    ["BAD_USER_INPUT", 400],
    [undefined, 500],
  ])("maps %s to HTTP %i", (code, status) => {
    const error = graphqlErrorToFetchError({ message: "x", extensions: { code } });
    expect(error.status).toBe(status);
    expect(error.data).toMatchObject({ error: { message: "x" } });
  });
});

describe("normalizeOrderDetails", () => {
  it("converts GraphQL string ids to numbers", () => {
    const order: GqlOrderDetails = {
      id: "7",
      title: "Order",
      description: null,
      date: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
      productsCount: 1,
      totals: [],
      products: [
        {
          id: "10",
          serialNumber: "SN-1",
          isNew: true,
          photo: null,
          title: "Monitor",
          type: "Monitors",
          specification: "24",
          status: "FREE",
          guarantee: { start: "2024-01-01T00:00:00.000Z", end: "2025-01-01T00:00:00.000Z" },
          date: "2024-01-01T00:00:00.000Z",
          prices: [],
          order: { id: "7", title: "Order" },
          group: { id: "3", title: "Group" },
          user: null,
        },
      ],
    };

    const normalized = normalizeOrderDetails(order);

    expect(normalized.id).toBe(7);
    expect(normalized.products[0]).toMatchObject({
      id: 10,
      order: { id: 7 },
      group: { id: 3, title: "Group" },
      user: null,
    });
  });
});
