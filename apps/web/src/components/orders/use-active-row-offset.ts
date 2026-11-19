"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

const ACTIVE_ROW = ".order-row--active";

export function useActiveRowOffset(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: unknown[],
) {
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const container = containerRef.current;
        const row = container?.querySelector<HTMLElement>(ACTIVE_ROW);
        const visible = row && row.offsetParent !== null;
        setOffset(
          container && visible
            ? Math.max(0, row.getBoundingClientRect().top - container.getBoundingClientRect().top)
            : 0,
        );
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, containerRef, ...deps]);

  return enabled ? offset : 0;
}
