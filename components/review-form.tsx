"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { parsePrUrl } from "@/lib/pr-url";
import { ProviderIcon } from "./provider-icon";

export function ReviewForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [post, setPost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();

  const parsed = useMemo(() => (url ? parsePrUrl(url) : null), [url]);
  const invalid = url.length > 8 && !parsed;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.url, postComment: post }),
      });
      const data = await res.json();
      if (data.review?.id) {
        router.push(`/reviews/${data.review.id}`);
        return;
      }
      setError(data.error ?? "The review could not start.");
    } catch {
      setError("The review could not start. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor={inputId} className="sr-only">
        Pull request or merge request link
      </label>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-surface p-2 shadow-lift focus-within:border-focus ${
          invalid ? "border-blocker/60" : "border-line"
        }`}
      >
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${parsed ? "bg-marker text-marker-ink" : "bg-surface-2 text-muted"}`}>
          <ProviderIcon provider={parsed?.provider} className="size-[18px]" />
        </span>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://github.com/org/repo/pull/128"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-describedby={hintId}
          aria-invalid={invalid}
          className="min-w-0 flex-1 bg-transparent py-2 font-mono focus-visible:outline-none text-[0.92rem] text-ink outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={!parsed || busy}
          className="h-10 shrink-0 rounded-xl bg-ink px-5 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Starting…" : "Review"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <p id={hintId} className={`text-sm ${invalid ? "text-blocker" : "text-muted"}`} aria-live="polite">
          {invalid
            ? "That link isn't a GitHub pull request or a GitLab merge request."
            : parsed
              ? `${parsed.provider === "github" ? "Pull request" : "Merge request"} #${parsed.number} in ${parsed.repo}`
              : "Works with github.com and any GitLab instance."}
        </p>
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-muted">
          <button
            type="button"
            role="switch"
            aria-checked={post}
            onClick={() => setPost((v) => !v)}
            className={`relative h-5 w-9 rounded-full ${post ? "bg-ink" : "bg-line-strong"}`}
          >
            <span className={`absolute top-0.5 size-4 rounded-full bg-bg shadow transition-[left] ${post ? "left-[18px]" : "left-0.5"}`} />
          </button>
          Also post the review as a comment
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-blocker/40 bg-blocker/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
    </form>
  );
}
