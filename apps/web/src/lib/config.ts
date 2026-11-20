/** Empty when the API is served from the same origin as the web app (single-container deploy). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_SAME_ORIGIN === "true"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");

export function assetUrl(pathOrUrl: string) {
  return pathOrUrl.startsWith("/uploads/") ? `${API_URL}${pathOrUrl}` : pathOrUrl;
}
