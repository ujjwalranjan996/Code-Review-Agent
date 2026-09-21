"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const next = params.get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Sign-in failed.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <label htmlFor="password" className="text-sm font-medium">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 outline-none focus:border-focus"
      />
      {error && (
        <p role="alert" className="text-sm text-blocker">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!password || busy}
        className="h-11 w-full rounded-xl bg-ink text-sm font-semibold text-bg disabled:opacity-40"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
