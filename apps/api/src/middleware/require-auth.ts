import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { verifyAccessToken, type AccessPayload } from "../modules/auth/tokens.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    res.locals.auth = await verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Access token is invalid or expired"));
  }
};

export const getAuth = (locals: Record<string, unknown>) => locals.auth as AccessPayload;
