import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <AuthSessionProvider>
      <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
        <LoginForm />
      </Suspense>
    </AuthSessionProvider>
  );
}
