"use client";

import { useEffect } from "react";
import { getStorage } from "@/lib/storage";
import { useAppDispatch } from "@/store";
import {
  PREFS_KEY,
  persistedStateRestored,
  parsePrefs,
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
        const prefs = parsePrefs(JSON.parse(event.newValue));
        if (prefs) dispatch(persistedStateRestored(prefs));
      } catch {
        // Ignore values written by something other than this app.
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  return null;
}
