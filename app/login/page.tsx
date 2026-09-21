import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <h1 className="mt-12 text-2xl font-semibold tracking-[-0.02em]">Sign in to your team&apos;s reviews</h1>
      <p className="mt-2 text-sm text-muted">This dashboard can read private code, so it&apos;s password protected.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
