import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Splash } from "@/components/ui/Splash";

export const instant = false;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Splash />}>
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </Suspense>
  );
}
