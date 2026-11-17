import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { Splash } from "@/components/ui/Splash";

export default function DashboardPage() {
  return (
    <Suspense fallback={<Splash />}>
      <DashboardView />
    </Suspense>
  );
}
