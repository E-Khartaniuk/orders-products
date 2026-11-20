"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/config";
import { useAppDispatch, useAppSelector } from "@/store";
import { serverEventReceived, type ServerEvent } from "@/store/server-events";
import { connectionChanged, countReceived } from "@/store/sessions-slice";

export function SocketBridge() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    const socket = io(API_URL || undefined, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      dispatch(connectionChanged(true));
      socket.emit("auth", tokenRef.current ?? "");
    });
    socket.on("disconnect", () => dispatch(connectionChanged(false)));
    socket.on("sessions:count", (count: number) => dispatch(countReceived(count)));
    socket.on("domain:event", (event: ServerEvent) => dispatch(serverEventReceived(event)));

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [dispatch]);

  useEffect(() => {
    tokenRef.current = accessToken;
    const socket = socketRef.current;
    if (socket?.connected) socket.emit("auth", accessToken ?? "");
  }, [accessToken]);

  return null;
}
