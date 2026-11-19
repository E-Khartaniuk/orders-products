export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type ImageProblem = "type" | "size";

export function checkImageFile(file: { type: string; size: number }): ImageProblem | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > IMAGE_MAX_BYTES) return "size";
  return null;
}
