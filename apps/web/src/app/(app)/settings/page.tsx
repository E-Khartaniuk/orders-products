import { Suspense } from "react";
import { SettingsView } from "@/components/settings/SettingsView";
import { Splash } from "@/components/ui/Splash";

export default function Page() {
  return (
    <Suspense fallback={<Splash />}>
      <SettingsView />
    </Suspense>
  );
}
