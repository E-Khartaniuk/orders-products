import path from "node:path";
import { z } from "zod";

const DEV_SECRET = "dev-only-secret-change-me-in-production-0123456789";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: z.string().min(32).default(`${DEV_SECRET}-access`),
    JWT_REFRESH_SECRET: z.string().min(32).default(`${DEV_SECRET}-refresh`),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    UPLOADS_DIR: z.string().default(path.resolve("uploads")),
    AVATAR_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(2 * 1024 * 1024),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
      if (env[key].startsWith(DEV_SECRET)) {
        ctx.addIssue({ code: "custom", path: [key], message: `${key} must be set in production` });
      }
    }
  });

const parsed = envSchema.parse(process.env);

export const config = {
  ...parsed,
  COOKIE_SECURE: parsed.COOKIE_SECURE ?? parsed.NODE_ENV === "production",
};
