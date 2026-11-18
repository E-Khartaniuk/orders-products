"use client";

import { useState, type ReactNode } from "react";

export function LazyMount({ when, children }: { when: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(when);
  if (when && !mounted) setMounted(true);
  return mounted ? children : null;
}
