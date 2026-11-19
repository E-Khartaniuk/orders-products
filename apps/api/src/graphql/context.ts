import DataLoader from "dataloader";
import type { Request } from "express";
import { GraphQLError } from "graphql";
import { verifyAccessToken, type AccessPayload } from "../modules/auth/tokens.js";
import { listProductsByOrderIds } from "../modules/products/products.service.js";

export type GraphqlContext = {
  auth: AccessPayload;
  loaders: {
    productsByOrderId: DataLoader<
      number,
      Awaited<ReturnType<typeof listProductsByOrderIds>>[number]
    >;
  };
};

const unauthenticated = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
  });

export async function buildContext({ req }: { req: Request }): Promise<GraphqlContext> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) throw unauthenticated("Authentication required");

  let auth: AccessPayload;
  try {
    auth = await verifyAccessToken(token);
  } catch {
    throw unauthenticated("Access token is invalid or expired");
  }

  return {
    auth,
    loaders: {
      productsByOrderId: new DataLoader((ids: readonly number[]) => listProductsByOrderIds(ids)),
    },
  };
}
