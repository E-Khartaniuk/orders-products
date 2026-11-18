import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config.js";
import { prisma } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import { detectImageType } from "../../lib/image-type.js";
import { toUserDto } from "../auth/auth.service.js";
import type { UpdateProfileBody } from "./profile.schemas.js";

export const UPLOADS_URL_PREFIX = "/uploads";
const AVATARS_DIR = "avatars";

function localPathOf(avatarUrl: string | null) {
  const prefix = `${UPLOADS_URL_PREFIX}/${AVATARS_DIR}/`;
  if (!avatarUrl?.startsWith(prefix)) return null;
  const fileName = path.basename(avatarUrl);
  return path.join(config.UPLOADS_DIR, AVATARS_DIR, fileName);
}

async function removeFile(avatarUrl: string | null) {
  const filePath = localPathOf(avatarUrl);
  if (!filePath) return;
  await unlink(filePath).catch(() => undefined);
}

async function findUser(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, "User no longer exists");
  return user;
}

export async function updateProfile(userId: number, input: UpdateProfileBody) {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toUserDto(user);
}

export async function setAvatar(userId: number, file: Buffer) {
  const extension = detectImageType(file);
  if (!extension) throw new HttpError(415, "Avatar must be a PNG, JPEG or WebP image");

  const current = await findUser(userId);
  const fileName = `${userId}-${randomUUID()}.${extension}`;
  const directory = path.join(config.UPLOADS_DIR, AVATARS_DIR);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), file);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: `${UPLOADS_URL_PREFIX}/${AVATARS_DIR}/${fileName}` },
  });
  await removeFile(current.avatarUrl);
  return toUserDto(user);
}

export async function removeAvatar(userId: number) {
  const current = await findUser(userId);
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  await removeFile(current.avatarUrl);
  return toUserDto(user);
}
