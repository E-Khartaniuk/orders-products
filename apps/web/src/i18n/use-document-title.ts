"use client";

import { useEffect } from "react";

export const APP_NAME = "Inventory";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const full = `${title} · ${APP_NAME}`;
    const apply = () => {
      if (document.title !== full) document.title = full;
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}
