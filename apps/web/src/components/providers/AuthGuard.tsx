"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Splash } from "@/components/ui/Splash";
import { useAppSelector } from "@/store";

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") return <Splash label="Проверка сессии…" />;

  return <>{children}</>;
}
