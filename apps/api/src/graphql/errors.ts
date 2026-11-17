import { unwrapResolverError } from "@apollo/server/errors";
import type { GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";

const CODE_BY_STATUS: Record<number, string> = {
  400: "BAD_USER_INPUT",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "BAD_USER_INPUT",
};

const PRISMA_CODES: Record<string, { code: string; message: string }> = {
  P2002: { code: "CONFLICT", message: "Resource with these unique fields already exists" },
  P2003: { code: "BAD_USER_INPUT", message: "Related resource does not exist" },
  P2025: { code: "NOT_FOUND", message: "Resource not found" },
};

export function formatError(
  formatted: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const original = unwrapResolverError(error);

  if (original instanceof ZodError) {
    return {
      message: "Validation failed",
      path: formatted.path,
      extensions: {
        code: "BAD_USER_INPUT",
        details: original.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }

  if (original instanceof HttpError) {
    return {
      message: original.message,
      path: formatted.path,
      extensions: { code: CODE_BY_STATUS[original.status] ?? "INTERNAL_SERVER_ERROR" },
    };
  }

  const prismaError = original as { name?: string; code?: string } | null;
  if (prismaError?.name === "PrismaClientKnownRequestError" && prismaError.code) {
    const mapped = PRISMA_CODES[prismaError.code];
    if (mapped) {
      return { message: mapped.message, path: formatted.path, extensions: { code: mapped.code } };
    }
  }

  const code = formatted.extensions?.code;
  if (code === "INTERNAL_SERVER_ERROR" || code === undefined) {
    console.error(original);
    return {
      message: "Internal server error",
      path: formatted.path,
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    };
  }

  return formatted;
}
