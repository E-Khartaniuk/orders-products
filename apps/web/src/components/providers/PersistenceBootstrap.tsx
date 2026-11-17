"use client";

import { useEffect } from "react";
import { getStorage } from "@/lib/storage";
import { useAppDispatch } from "@/store";
import {
  PREFS_KEY,
  persistedStateRestored,
  prefsSchema,
  readPersistedState,
} from "@/store/persisted";

export function PersistenceBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      persistedStateRestored(readPersistedState(getStorage("local"), getStorage("session"))),
    );

    const onStorage = (event: StorageEvent) => {
      if (event.key !== PREFS_KEY || event.newValue === null) return;
      if (event.storageArea !== getStorage("local")) return;
      try {
        const parsed = prefsSchema.safeParse(JSON.parse(event.newValue));
        if (parsed.success) dispatch(persistedStateRestored(parsed.data));
      } catch {
        // Ignore values written by something other than this app.
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  return null;
}
