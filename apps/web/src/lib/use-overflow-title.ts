"use client";

import { useCallback, type MouseEvent } from "react";

export function useOverflowTitle(text: string) {
  return useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const truncated = element.scrollWidth > element.clientWidth + 1;
      if (truncated) element.setAttribute("title", text);
      else element.removeAttribute("title");
    },
    [text],
  );
}
