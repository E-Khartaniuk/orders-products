import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { createGraphqlMiddleware } from "./graphql/index.js";
import { UPLOADS_URL_PREFIX } from "./lib/uploads.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/require-auth.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { ordersRouter } from "./modules/orders/orders.router.js";
import { productsRouter } from "./modules/products/products.router.js";
import { profileRouter } from "./modules/profile/profile.router.js";

export function createApp() {
  const app = express();

  if (config.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", db: "up" });
    } catch {
      res.status(503).json({ status: "degraded", db: "down" });
    }
  });

  app.use(
    UPLOADS_URL_PREFIX,
    express.static(config.UPLOADS_DIR, {
      fallthrough: false,
      index: false,
      maxAge: "30d",
      immutable: true,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api/profile", requireAuth, profileRouter);
  app.use("/api/orders", requireAuth, ordersRouter);
  app.use("/api/products", requireAuth, productsRouter);
  app.use("/api/graphql", createGraphqlMiddleware());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
