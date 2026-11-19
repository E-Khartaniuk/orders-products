import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { config } from "../../config.js";

const accessKey = new TextEncoder().encode(config.JWT_ACCESS_SECRET);
const refreshKey = new TextEncoder().encode(config.JWT_REFRESH_SECRET);
const ISSUER = "inventory-api";

export type AccessPayload = { userId: number; email: string };

export async function signAccessToken(payload: AccessPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(config.ACCESS_TOKEN_TTL)
    .sign(accessKey);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, accessKey, { issuer: ISSUER, algorithms: ["HS256"] });
  return { userId: Number(payload.sub), email: String(payload.email) };
}

export function refreshExpiresAt(now = new Date()) {
  return new Date(now.getTime() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function signRefreshToken(sessionId: string, userId: number, expiresAt: Date) {
  return new SignJWT({ nonce: randomBytes(16).toString("hex") })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setJti(sessionId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(refreshKey);
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshKey, { issuer: ISSUER, algorithms: ["HS256"] });
  if (!payload.jti || !payload.sub) throw new Error("Malformed refresh token");
  return { sessionId: payload.jti, userId: Number(payload.sub) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const newSessionId = () => randomUUID();
