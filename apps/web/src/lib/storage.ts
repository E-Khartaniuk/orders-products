export type StorageKind = "local" | "session";

export type Parser<T> = (value: unknown) => T | null;

export function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(storage: Storage | null, key: string, parse: Parser<T>): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeJson(storage: Storage | null, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: persistence is best effort.
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isOptionalString = (value: unknown, maxLength: number) =>
  value === undefined || (typeof value === "string" && value.length <= maxLength);
