import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { subscribe } from "./events/bus.js";
import { verifyAccessToken } from "./modules/auth/tokens.js";

export const AUTHENTICATED_ROOM = "authenticated";
export const SOCKET_PING_INTERVAL_MS = 10_000;
export const SOCKET_PING_TIMEOUT_MS = 5_000;

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
    // A connection that is lost without a close (crashed tab, dropped network,
    // a tab closed mid-upgrade on long-polling) only goes away on a missed
    // heartbeat. 10 s + 5 s keeps the tabs counter at most ~15 s stale instead
    // of the default 45 s.
    pingInterval: SOCKET_PING_INTERVAL_MS,
    pingTimeout: SOCKET_PING_TIMEOUT_MS,
  });

  // Namespace sockets drop the closing socket before "disconnect" fires;
  // io.engine.clientsCount still includes it at that point.
  const broadcastCount = () => io.emit("sessions:count", io.of("/").sockets.size);

  io.on("connection", (socket) => {
    broadcastCount();
    socket.on("disconnect", broadcastCount);

    socket.on("auth", async (token: unknown, ack?: (ok: boolean) => void) => {
      const ok =
        typeof token === "string" &&
        token.length > 0 &&
        (await verifyAccessToken(token).then(
          () => true,
          () => false,
        ));

      if (ok) await socket.join(AUTHENTICATED_ROOM);
      else await socket.leave(AUTHENTICATED_ROOM);
      if (typeof ack === "function") ack(ok);
    });
  });

  const unsubscribe = subscribe((event) => {
    io.to(AUTHENTICATED_ROOM).emit("domain:event", event);
  });

  return {
    io,
    close: async () => {
      unsubscribe();
      await io.close();
    },
  };
}
