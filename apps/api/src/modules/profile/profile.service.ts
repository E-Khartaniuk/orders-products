import { prisma } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import { removeStoredImage, storeImage } from "../../lib/uploads.js";
import { toUserDto } from "../auth/auth.service.js";
import type { UpdateProfileBody } from "./profile.schemas.js";

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
  const current = await findUser(userId);
  const avatarUrl = await storeImage("avatars", String(userId), file);
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  await removeStoredImage(current.avatarUrl);
  return toUserDto(user);
}

export async function removeAvatar(userId: number) {
  const current = await findUser(userId);
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  await removeStoredImage(current.avatarUrl);
  return toUserDto(user);
}
