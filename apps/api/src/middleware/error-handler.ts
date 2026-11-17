import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";

const PRISMA_ERRORS = {
  P2002: { status: 409, message: "Resource with these unique fields already exists" },
  P2003: { status: 422, message: "Related resource does not exist" },
  P2025: { status: 404, message: "Resource not found" },
} as const;

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err?.name === "PrismaClientKnownRequestError" && err.code in PRISMA_ERRORS) {
    const { status, message } = PRISMA_ERRORS[err.code as keyof typeof PRISMA_ERRORS];
    res.status(status).json({ error: { message } });
    return;
  }

  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
