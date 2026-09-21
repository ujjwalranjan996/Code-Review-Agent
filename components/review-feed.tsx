"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { duration, timeAgo } from "@/lib/format";
import { STALE_AFTER_MS, type Review } from "@/lib/types";
import { ProviderIcon } from "./provider-icon";
import { RiskTag, SEV_BG, SeverityCounts, countBySeverity, topSeverity } from "./severity";
import { useNow } from "./use-now";

type Feed = { reviews: Review[]; store: "redis" | "memory"; connected: boolean };
const fetcher = (u: string) => fetch(u).then((r) => r.json());

const FILTERS = [
  { value: "all", label: "All" },
  { value: "attention", label: "Has blockers" },
  { value: "running", label: "In progress" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function effectiveStatus(r: Review, now: number) {
  if (r.status === "running" && now - r.createdAt > STALE_AFTER_MS) return "failed";
  return r.status;
}

export function ReviewFeed() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, error, isLoading } = useSWR<Feed>("/api/reviews", fetcher, {
    refreshInterval: (d) => (d?.reviews?.some((r) => r.status === "running") ? 2500 : 12000),
    revalidateOnFocus: true,
  });
  const now = useNow(1000);

  const rows = useMemo(() => {
    const all = data?.reviews ?? [];
    if (filter === "running") return all.filter((r) => effectiveStatus(r, now) === "running");
    if (filter === "attention") return all.filter((r) => countBySeverity(r.findings).blocker > 0);
    return all;
  }, [data, filter, now]);

  return (
    <section aria-labelledby="reviews-heading" className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-baseline gap-3">
          <h2 id="reviews-heading" className="text-lg font-semibold tracking-[-0.01em]">
            Recent reviews
          </h2>
          {data && <ConnectionNote connected={data.connected} store={data.store} />}
        </div>
        <div role="tablist" aria-label="Filter reviews" className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === f.value ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="py-10 text-sm text-blocker">Reviews could not be loaded. Refresh the page to try again.</p>}
      {isLoading && <FeedSkeleton />}
      {data && rows.length === 0 && (
        <p className="py-14 text-center text-sm text-muted">
          {filter === "all"
            ? "No reviews yet. Paste a pull request link above to run the first one."
            : filter === "running"
              ? "Nothing is being reviewed right now."
              : "No reviews with blockers. Nice."}
        </p>
      )}

      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <FeedRow key={r.id} review={r} now={now} />
        ))}
      </ul>
    </section>
  );
}

function FeedRow({ review: r, now }: { review: Review; now: number }) {
  const status = effectiveStatus(r, now);
  const sev = status === "done" ? topSeverity(r) : null;
  const gutter =
    status === "running" ? "bg-marker" : status === "failed" ? "bg-line-strong" : sev ? SEV_BG[sev] : "bg-line";

  return (
    <li>
      <Link
        href={`/reviews/${r.id}`}
        className="group grid grid-cols-[4px_1fr] gap-4 rounded-lg py-4 pr-2 hover:bg-surface/60 sm:grid-cols-[4px_1fr_auto]"
      >
        <span className={`w-1 self-stretch rounded-full ${gutter} ${status === "running" ? "pulse-dot" : ""}`} aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ProviderIcon provider={r.provider} className="size-3.5" />
            <span className="truncate font-mono text-[0.8rem]">{r.repo}</span>
            <span className="font-mono text-[0.8rem]">#{r.number}</span>
            {r.demo && <span className="rounded bg-surface-2 px-1.5 text-xs">sample</span>}
          </div>
          <p className="mt-1 truncate font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
            {r.title ?? (status === "running" ? "Fetching the diff…" : "Untitled change")}
          </p>
          <div className="mt-2 sm:hidden">
            <RowStatus review={r} status={status} now={now} />
          </div>
        </div>
        <div className="hidden flex-col items-end justify-center gap-1.5 sm:flex">
          <RowStatus review={r} status={status} now={now} />
          <span className="text-xs text-muted">{timeAgo(r.createdAt, now)}</span>
        </div>
      </Link>
    </li>
  );
}

function RowStatus({ review: r, status, now }: { review: Review; status: string; now: number }) {
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full bg-marker pulse-dot" aria-hidden="true" />
        Reviewing <span className="tabular-nums text-muted">{duration(now - r.createdAt)}</span>
      </span>
    );
  if (status === "failed") return <span className="text-sm text-muted">Did not finish</span>;
  return (
    <span className="flex items-center gap-3">
      <SeverityCounts findings={r.findings} />
      <RiskTag risk={r.risk} />
    </span>
  );
}

function ConnectionNote({ connected, store }: { connected: boolean; store: string }) {
  const note = !connected
    ? "Sample mode: n8n is not connected yet"
    : store === "memory"
      ? "Connected. History resets on redeploy until Redis is added"
      : null;
  if (!note) return null;
  return <span className="text-xs text-muted">{note}</span>;
}

function FeedSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-line">
      {[0, 1, 2].map((i) => (
        <li key={i} className="grid grid-cols-[4px_1fr] gap-4 py-5">
          <span className="w-1 rounded-full bg-line" />
          <div className="space-y-2">
            <div className="h-3 w-40 rounded bg-surface-2" />
            <div className="h-4 w-2/3 rounded bg-surface-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
