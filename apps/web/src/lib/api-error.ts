type ErrorDetail = { path: string; message: string };

export type ParsedApiError = {
  status: number | null;
  message: string;
  details: ErrorDetail[];
};

type ApiErrorBody = {
  error?: { message?: string; details?: ErrorDetail[] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function parseApiError(
  error: unknown,
  fallback: string,
  networkMessage = fallback,
): ParsedApiError {
  if (!isRecord(error) || !("status" in error)) {
    return { status: null, message: fallback, details: [] };
  }

  if (typeof error.status !== "number") {
    return { status: null, message: networkMessage, details: [] };
  }

  const body = (isRecord(error.data) ? error.data : {}) as ApiErrorBody;
  return {
    status: error.status,
    message: body.error?.message ?? fallback,
    details: Array.isArray(body.error?.details) ? body.error.details : [],
  };
}
