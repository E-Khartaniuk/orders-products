"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/lib/config";
import { useAppDispatch } from "@/store";
import { connectionChanged, countReceived } from "@/store/sessions-slice";

export function SocketBridge() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });

    socket.on("connect", () => dispatch(connectionChanged(true)));
    socket.on("disconnect", () => dispatch(connectionChanged(false)));
    socket.on("sessions:count", (count: number) => dispatch(countReceived(count)));

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return null;
}
