import { Router } from "express";
import { imageUpload, requireFile } from "../../lib/uploads.js";
import { getAuth } from "../../middleware/require-auth.js";
import { validate, type Validated } from "../../middleware/validate.js";
import { updateProfileBody, type UpdateProfileBody } from "./profile.schemas.js";
import * as profileService from "./profile.service.js";

export const profileRouter = Router();

profileRouter.patch("/", validate({ body: updateProfileBody }), async (_req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, UpdateProfileBody>;
  res.json({ user: await profileService.updateProfile(getAuth(res.locals).userId, body) });
});

profileRouter.put("/avatar", imageUpload("avatar"), async (req, res) => {
  const file = requireFile(req.file, "avatar");
  res.json({ user: await profileService.setAvatar(getAuth(res.locals).userId, file) });
});

profileRouter.delete("/avatar", async (_req, res) => {
  res.json({ user: await profileService.removeAvatar(getAuth(res.locals).userId) });
});
