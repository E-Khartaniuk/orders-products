"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store";
import { useRestoreSessionMutation } from "@/store/api";

export function SessionBootstrap() {
  const status = useAppSelector((state) => state.auth.status);
  const [restoreSession] = useRestoreSessionMutation();
  const started = useRef(false);

  useEffect(() => {
    if (status !== "unknown" || started.current) return;
    started.current = true;
    restoreSession();
  }, [status, restoreSession]);

  return null;
}
