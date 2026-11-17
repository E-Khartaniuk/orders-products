import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Splash } from "@/components/ui/Splash";

export default function LoginPage() {
  return (
    <Suspense fallback={<Splash />}>
      <LoginForm />
    </Suspense>
  );
}
