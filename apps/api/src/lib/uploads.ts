import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RequestHandler } from "express";
import multer from "multer";
import { config } from "../config.js";
import { HttpError } from "./http-error.js";
import { detectImageType } from "./image-type.js";

export const UPLOADS_URL_PREFIX = "/uploads";

export type UploadFolder = "avatars" | "products";

export function imageUpload(field: string): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.IMAGE_MAX_BYTES, files: 1 },
  }).single(field);

  return (req, res, next) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        next(new HttpError(413, `Image must be at most ${config.IMAGE_MAX_BYTES} bytes`));
        return;
      }
      next(error);
    });
  };
}

export function requireFile(file: Express.Multer.File | undefined, field: string) {
  if (!file) throw new HttpError(400, `Attach an image in the '${field}' field`);
  return file.buffer;
}

export async function storeImage(folder: UploadFolder, prefix: string, file: Buffer) {
  const extension = detectImageType(file);
  if (!extension) throw new HttpError(415, "Image must be a PNG, JPEG or WebP file");

  const fileName = `${prefix}-${randomUUID()}.${extension}`;
  const directory = path.join(config.UPLOADS_DIR, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), file);
  return `${UPLOADS_URL_PREFIX}/${folder}/${fileName}`;
}

export async function removeStoredImage(url: string | null | undefined) {
  if (!url?.startsWith(`${UPLOADS_URL_PREFIX}/`)) return;
  const [folder] = url.slice(UPLOADS_URL_PREFIX.length + 1).split("/");
  if (folder !== "avatars" && folder !== "products") return;
  const filePath = path.join(config.UPLOADS_DIR, folder, path.basename(url));
  await unlink(filePath).catch(() => undefined);
}
