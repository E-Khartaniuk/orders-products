import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/lib/config";
import type { AuthResponse } from "@/types/api";
import { credentialsReceived, loggedOut } from "./auth-slice";

type StateWithAuth = { auth: { accessToken: string | null } };

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

const fetchQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as StateWithAuth).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

type AppBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;

const REFRESH_PATH = "/auth/refresh";
const REFRESH_LOCK = "op:auth-refresh";

const urlOf = (args: string | FetchArgs) => (typeof args === "string" ? args : args.url);

// Tabs share one refresh cookie. Refreshing one tab at a time means each request
// carries the latest rotated token; parallel refreshes would present a token the
// API already rotated, which it treats as theft and revokes every session.
async function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  return locks ? ((await locks.request(REFRESH_LOCK, run)) as T) : run();
}

const rawBaseQuery: AppBaseQuery = (args, api, extraOptions) =>
  urlOf(args) === REFRESH_PATH
    ? withRefreshLock(async () => fetchQuery(args, api, extraOptions))
    : fetchQuery(args, api, extraOptions);

let refreshInFlight: Promise<boolean> | null = null;

export const baseQueryWithReauth: AppBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || AUTH_PATHS.includes(urlOf(args))) {
    return result;
  }

  refreshInFlight ??= (async () => {
    try {
      const refresh = await rawBaseQuery({ url: REFRESH_PATH, method: "POST" }, api, extraOptions);
      if (refresh.data) {
        api.dispatch(credentialsReceived(refresh.data as AuthResponse));
        return true;
      }
      api.dispatch(loggedOut());
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  if (await refreshInFlight) {
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
