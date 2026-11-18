import { Suspense } from "react";
import { UsersView } from "@/components/users/UsersView";
import { Splash } from "@/components/ui/Splash";

export default function Page() {
  return (
    <Suspense fallback={<Splash />}>
      <UsersView />
    </Suspense>
  );
}
