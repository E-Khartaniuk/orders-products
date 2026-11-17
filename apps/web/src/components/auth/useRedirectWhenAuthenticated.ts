"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { safeRedirect } from "@/lib/auth-schemas";
import { useAppSelector } from "@/store";

export function useRedirectWhenAuthenticated() {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();
  const target = safeRedirect(useSearchParams().get("next"));

  useEffect(() => {
    if (status === "authenticated") router.replace(target);
  }, [status, router, target]);

  return { status, target };
}
