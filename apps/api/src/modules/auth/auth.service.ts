import bcrypt from "bcryptjs";
import { prisma } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import type { ChangePasswordBody, LoginBody, RegisterBody } from "./auth.schemas.js";
import {
  hashToken,
  newSessionId,
  refreshExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens.js";

const BCRYPT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("timing-safe-placeholder", BCRYPT_ROUNDS);

type UserRecord = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale?: string | null;
};

export const toUserDto = (user: UserRecord) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  locale: user.locale ?? null,
});

export type UserDto = ReturnType<typeof toUserDto>;

export type AuthResult = {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

async function issueTokens(user: UserRecord, userAgent?: string): Promise<AuthResult> {
  const sessionId = newSessionId();
  const expiresAt = refreshExpiresAt();
  const refreshToken = await signRefreshToken(sessionId, user.id, expiresAt);

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: userAgent?.slice(0, 255),
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({ userId: user.id, email: user.email });
  return { user: toUserDto(user), accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

export async function register(input: RegisterBody, userAgent?: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "User with this email already exists");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      locale: input.locale,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    },
  });

  return issueTokens(user, userAgent);
}

export async function login(input: LoginBody, userAgent?: string) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt
    .compare(input.password, user?.passwordHash ?? DUMMY_HASH)
    .catch(() => false);
  if (!user || !valid) throw new HttpError(401, "Invalid email or password");

  return issueTokens(user, userAgent);
}

export async function refresh(refreshToken: string | undefined, userAgent?: string) {
  if (!refreshToken) throw new HttpError(401, "Refresh token is missing");

  let claims: { sessionId: string; userId: number };
  try {
    claims = await verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Refresh token is invalid or expired");
  }

  const session = await prisma.refreshSession.findUnique({
    where: { id: claims.sessionId },
    include: { user: true },
  });

  if (!session || session.userId !== claims.userId) {
    throw new HttpError(401, "Session not found");
  }

  if (session.tokenHash !== hashToken(refreshToken)) {
    await prisma.refreshSession.deleteMany({ where: { userId: session.userId } });
    throw new HttpError(401, "Refresh token reuse detected");
  }

  await prisma.refreshSession.delete({ where: { id: session.id } });

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(401, "Session expired");
  }

  return issueTokens(session.user, userAgent);
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  try {
    const { sessionId } = await verifyRefreshToken(refreshToken);
    await prisma.refreshSession.deleteMany({ where: { id: sessionId } });
  } catch {
    return;
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, "User no longer exists");
  return toUserDto(user);
}

export async function changePassword(
  userId: number,
  input: ChangePasswordBody,
  currentRefreshToken: string | undefined,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, "User no longer exists");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash).catch(() => false);
  if (!valid) {
    throw new HttpError(400, "Validation failed", [
      { path: "currentPassword", message: "Current password is incorrect" },
    ]);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) },
  });
  await prisma.refreshSession.deleteMany({
    where: currentRefreshToken
      ? { userId, NOT: { tokenHash: hashToken(currentRefreshToken) } }
      : { userId },
  });
}
