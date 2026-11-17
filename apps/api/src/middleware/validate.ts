import type { RequestHandler } from "express";
import type { z } from "zod";

type Schemas = {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
};

export type Validated<P = unknown, Q = unknown, B = unknown> = {
  params: P;
  query: Q;
  body: B;
};

export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    res.locals.validated = {
      params: schemas.params ? schemas.params.parse(req.params) : req.params,
      query: schemas.query ? schemas.query.parse(req.query) : req.query,
      body: schemas.body ? schemas.body.parse(req.body) : req.body,
    };
    next();
  };
}
