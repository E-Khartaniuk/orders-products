import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

type Listener = (event: Record<string, unknown>) => void;

const SOURCE = readFileSync(path.resolve(__dirname, "../../public/sw.js"), "utf8");

class FakeCache {
  store = new Map<string, Response>();
  async match(request: Request | string) {
    return this.store.get(typeof request === "string" ? request : new URL(request.url).pathname);
  }
  async put(request: Request | string, response: Response) {
    this.store.set(typeof request === "string" ? request : new URL(request.url).pathname, response);
  }
  async addAll(urls: string[]) {
    urls.forEach((url) => this.store.set(url, new Response(`cached ${url}`)));
  }
  async keys() {
    return [...this.store.keys()].map((key) => new Request(`http://app.test${key}`));
  }
  async delete(request: Request) {
    return this.store.delete(new URL(request.url).pathname);
  }
}

function loadServiceWorker(fetchImpl: (request: Request) => Promise<Response>) {
  const listeners = new Map<string, Listener>();
  const named = new Map<string, FakeCache>();
  const caches = {
    open: async (name: string) => {
      if (!named.has(name)) named.set(name, new FakeCache());
      return named.get(name)!;
    },
    match: async (request: Request | string) => {
      for (const cache of named.values()) {
        const hit = await cache.match(request);
        if (hit) return hit;
      }
      return undefined;
    },
    keys: async () => [...named.keys()],
    delete: async (name: string) => named.delete(name),
  };
  const self = {
    location: { origin: "http://app.test" },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };

  new Function("self", "caches", "fetch", SOURCE)(self, caches, fetchImpl);

  const dispatch = async (type: string, extra: Record<string, unknown> = {}) => {
    let pending: Promise<unknown> | undefined;
    let responded: Promise<Response> | undefined;
    listeners.get(type)?.({
      ...extra,
      waitUntil: (promise: Promise<unknown>) => (pending = promise),
      respondWith: (promise: Promise<Response>) => (responded = promise),
    });
    await pending;
    return responded;
  };

  return { dispatch, named, self };
}

const navigation = (url: string) => {
  const request = new Request(url);
  Object.defineProperty(request, "mode", { value: "navigate" });
  return request;
};

describe("service worker", () => {
  it("precaches the offline page on install", async () => {
    const sw = loadServiceWorker(vi.fn());
    await sw.dispatch("install");

    const precached = [...sw.named.values()].flatMap((cache) => [...cache.store.keys()]);
    expect(precached).toContain("/offline.html");
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });

  it("serves the offline page when navigation fails without a cached copy", async () => {
    const sw = loadServiceWorker(() => Promise.reject(new TypeError("offline")));
    await sw.dispatch("install");

    const response = await sw.dispatch("fetch", { request: navigation("http://app.test/orders") });

    expect(await response?.text()).toBe("cached /offline.html");
  });

  it("serves hashed static assets from cache after the first load", async () => {
    const fetchImpl = vi.fn(async () => new Response("chunk"));
    const sw = loadServiceWorker(fetchImpl);
    const request = new Request("http://app.test/_next/static/chunks/app.js");

    await (await sw.dispatch("fetch", { request }))?.text();
    const second = await sw.dispatch("fetch", { request });

    expect(await second?.text()).toBe("chunk");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("leaves API and cross-origin requests to the network", async () => {
    const sw = loadServiceWorker(vi.fn());

    expect(
      await sw.dispatch("fetch", { request: new Request("http://api.test/api/orders") }),
    ).toBeUndefined();
    expect(
      await sw.dispatch("fetch", { request: new Request("http://app.test/api/orders") }),
    ).toBeUndefined();
  });
});
