import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types/api";
import { makeStore } from "./index";
import { credentialsReceived, userUpdated } from "./auth-slice";
import { localeChanged } from "./prefs-slice";

const user = (locale: User["locale"]): User => ({
  id: 1,
  email: "demo@inventory.local",
  name: "Demo",
  avatarUrl: null,
  locale,
});

const profileCalls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls
    .map(([request]) => request as Request)
    .filter((request) => request.url.endsWith("/api/profile"));

function mockFetch() {
  const fetchMock = vi.fn(async (request: Request) => {
    const body = await request
      .clone()
      .json()
      .catch(() => ({}));
    return new Response(JSON.stringify({ user: { ...user("ru"), ...body } }), {
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("user locale", () => {
  it("applies the language stored in the profile after sign in", () => {
    mockFetch();
    const store = makeStore();

    store.dispatch(credentialsReceived({ user: user("en"), accessToken: "token" }));

    expect(store.getState().prefs.locale).toBe("en");
  });

  it("follows profile updates", () => {
    mockFetch();
    const store = makeStore();
    store.dispatch(credentialsReceived({ user: user("ru"), accessToken: "token" }));

    store.dispatch(userUpdated(user("en")));

    expect(store.getState().prefs.locale).toBe("en");
  });

  it("saves a new language to the profile when signed in", async () => {
    const fetchMock = mockFetch();
    const store = makeStore();
    store.dispatch(credentialsReceived({ user: user("ru"), accessToken: "token" }));

    store.dispatch(localeChanged("en"));
    await vi.waitFor(() => expect(profileCalls(fetchMock)).toHaveLength(1));

    const [request] = profileCalls(fetchMock);
    expect(request.method).toBe("PATCH");
    expect(await request.json()).toEqual({ locale: "en" });
  });

  it("keeps the language local for anonymous visitors", async () => {
    const fetchMock = mockFetch();
    const store = makeStore();

    store.dispatch(localeChanged("en"));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(store.getState().prefs.locale).toBe("en");
    expect(profileCalls(fetchMock)).toHaveLength(0);
  });

  it("stores the current language for a profile without one", async () => {
    const fetchMock = mockFetch();
    const store = makeStore();
    store.dispatch(localeChanged("en"));

    store.dispatch(credentialsReceived({ user: user(null), accessToken: "token" }));
    await vi.waitFor(() => expect(profileCalls(fetchMock)).toHaveLength(1));

    expect(store.getState().prefs.locale).toBe("en");
    expect(await profileCalls(fetchMock)[0].json()).toEqual({ locale: "en" });
  });
});
