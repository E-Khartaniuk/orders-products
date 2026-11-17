import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
  });

  const broadcastCount = () => io.emit("sessions:count", io.engine.clientsCount);

  io.on("connection", (socket) => {
    broadcastCount();
    socket.on("disconnect", broadcastCount);
  });

  return io;
}
