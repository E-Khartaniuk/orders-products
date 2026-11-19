import { Router, type CookieOptions, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { config } from "../../config.js";
import { getAuth, requireAuth } from "../../middleware/require-auth.js";
import { validate, type Validated } from "../../middleware/validate.js";
import {
  changePasswordBody,
  loginBody,
  registerBody,
  type ChangePasswordBody,
  type LoginBody,
  type RegisterBody,
} from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export const REFRESH_COOKIE = "refresh_token";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: "lax",
  path: "/api/auth",
};

function sendAuth(res: Response, result: authService.AuthResult, status = 200) {
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...cookieOptions,
    expires: result.refreshExpiresAt,
  });
  res.status(status).json({ user: result.user, accessToken: result.accessToken });
}

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.AUTH_RATE_LIMIT ?? (config.NODE_ENV === "test" ? 1000 : 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { message: "Too many attempts, try again later" } },
});

export const authRouter = Router();

authRouter.post(
  "/register",
  credentialsLimiter,
  validate({ body: registerBody }),
  async (req, res) => {
    const { body } = res.locals.validated as Validated<unknown, unknown, RegisterBody>;
    sendAuth(res, await authService.register(body, req.get("user-agent")), 201);
  },
);

authRouter.post("/login", credentialsLimiter, validate({ body: loginBody }), async (req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, LoginBody>;
  sendAuth(res, await authService.login(body, req.get("user-agent")));
});

authRouter.post("/refresh", async (req, res) => {
  try {
    sendAuth(res, await authService.refresh(req.cookies?.[REFRESH_COOKIE], req.get("user-agent")));
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    throw error;
  }
});

authRouter.post("/logout", async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  res.json({ user: await authService.getMe(getAuth(res.locals).userId) });
});

authRouter.put(
  "/password",
  requireAuth,
  credentialsLimiter,
  validate({ body: changePasswordBody }),
  async (req, res) => {
    const { body } = res.locals.validated as Validated<unknown, unknown, ChangePasswordBody>;
    await authService.changePassword(
      getAuth(res.locals).userId,
      body,
      req.cookies?.[REFRESH_COOKIE],
    );
    res.status(204).end();
  },
);
