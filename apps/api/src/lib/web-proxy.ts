import { request } from "node:http";
import type { RequestHandler } from "express";
import { UPLOADS_URL_PREFIX } from "./uploads.js";

const OWN_PREFIXES = ["/api/", UPLOADS_URL_PREFIX + "/", "/socket.io/"];

function isOwnPath(path: string) {
  return path === "/api" || OWN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Forwards every request the API does not own to the Next.js server, so the
 * whole app is served from one origin (single-container deploy).
 */
export function webProxy(target: string): RequestHandler {
  const { hostname, port } = new URL(target);

  return (req, res, next) => {
    if (isOwnPath(req.path)) {
      next();
      return;
    }

    const upstream = request(
      {
        hostname,
        port,
        method: req.method,
        path: req.originalUrl,
        headers: {
          ...req.headers,
          "x-forwarded-host": req.headers.host,
          "x-forwarded-proto": req.protocol,
        },
      },
      (upstreamRes) => {
        res.removeHeader("x-powered-by");
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstream.on("error", (error) => {
      if (res.headersSent) res.destroy(error);
      else res.status(502).json({ error: { message: "Web app is unavailable" } });
    });
    req.pipe(upstream);
  };
}
