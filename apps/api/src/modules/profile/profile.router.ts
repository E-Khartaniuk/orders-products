import { Router, type RequestHandler } from "express";
import multer from "multer";
import { config } from "../../config.js";
import { HttpError } from "../../lib/http-error.js";
import { getAuth } from "../../middleware/require-auth.js";
import { validate, type Validated } from "../../middleware/validate.js";
import { updateProfileBody, type UpdateProfileBody } from "./profile.schemas.js";
import * as profileService from "./profile.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.AVATAR_MAX_BYTES, files: 1 },
}).single("avatar");

const avatarUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, `Avatar must be at most ${config.AVATAR_MAX_BYTES} bytes`));
      return;
    }
    next(error);
  });
};

export const profileRouter = Router();

profileRouter.patch("/", validate({ body: updateProfileBody }), async (_req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, UpdateProfileBody>;
  res.json({ user: await profileService.updateProfile(getAuth(res.locals).userId, body) });
});

profileRouter.put("/avatar", avatarUpload, async (req, res) => {
  if (!req.file) throw new HttpError(400, "Attach an image in the 'avatar' field");
  res.json({ user: await profileService.setAvatar(getAuth(res.locals).userId, req.file.buffer) });
});

profileRouter.delete("/avatar", async (_req, res) => {
  res.json({ user: await profileService.removeAvatar(getAuth(res.locals).userId) });
});
