import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Splash } from "@/components/ui/Splash";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<Splash />}>
      <RegisterForm />
    </Suspense>
  );
}
