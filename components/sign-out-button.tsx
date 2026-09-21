"use client";

import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      aria-label="Sign out"
      title="Sign out"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      className="grid size-8 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
    >
      <LogOut className="size-3.5" strokeWidth={2.2} />
    </button>
  );
}
