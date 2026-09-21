"use client";

import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { duration, timeAgo } from "@/lib/format";
import { CATEGORY_LABEL, SEVERITIES, SEVERITY_LABEL, type Finding, type Review, type Severity } from "@/lib/types";
import { ProviderIcon, providerNoun } from "./provider-icon";
import { effectiveStatus } from "./review-feed";
import { RichText } from "./rich-text";
import { RiskTag, SEV_BG, SEV_TEXT, countBySeverity, plural } from "./severity";
import { useNow } from "./use-now";

const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (r.status === 404) throw new Error("not-found");
  return r.json();
};

export function ReviewDetail({ id }: { id: string }) {
  const { data, error } = useSWR<{ review: Review }>(`/api/reviews/${id}`, fetcher, {
    refreshInterval: (d) => (d?.review?.status === "running" ? 2000 : 0),
  });
  const now = useNow(1000);
  const r = data?.review;
  const status = r ? effectiveStatus(r, now) : null;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All reviews
      </Link>

      {error && (
        <p className="mt-16 text-muted">
          {error.message === "not-found"
            ? "This review doesn't exist, or it was cleared from history."
            : "The review could not be loaded. Refresh to try again."}
        </p>
      )}
      {!r && !error && <div className="mt-10 h-24 max-w-2xl rounded-xl bg-surface-2" aria-label="Loading" />}

      {r && (
        <>
          <ReviewHeader review={r} now={now} />
          {r.demo && (
            <p className="mt-6 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
              This is sample output. Set <code className="font-mono text-ink">N8N_WEBHOOK_URL</code> to review real
              changes with your model.
            </p>
          )}
          {status === "running" && <Reviewing startedAt={r.createdAt} now={now} />}
          {status === "failed" && <Failed review={r} />}
          {status === "done" && <Results review={r} />}
        </>
      )}
    </main>
  );
}

function ReviewHeader({ review: r, now }: { review: Review; now: number }) {
  return (
    <header className="mt-8 border-b border-line pb-8">
      <a
        href={r.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md font-mono text-sm text-muted hover:text-ink"
      >
        <ProviderIcon provider={r.provider} className="size-4" />
        {r.repo} #{r.number}
        <ExternalLink className="size-3.5" aria-label={`Open ${providerNoun(r.provider)}`} />
      </a>
      <h1 className="mt-3 max-w-[40ch] text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.1rem]">
        {r.title ?? (r.status === "running" ? "Reading the change…" : `${r.provider === "gitlab" ? "Merge" : "Pull"} request #${r.number}`)}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {r.author ? <>Opened by {r.author}. </> : null}
        Review started {timeAgo(r.createdAt, now)}
        {r.finishedAt ? `, took ${duration(r.finishedAt - r.createdAt)}` : ""}.
      </p>
    </header>
  );
}

function Reviewing({ startedAt, now }: { startedAt: number; now: number }) {
  return (
    <section aria-live="polite" className="mt-10">
      <p className="text-lg font-medium">
        Reviewing the diff <span className="tabular-nums text-muted">{duration(now - startedAt)}</span>
      </p>
      <p className="mt-1 max-w-[60ch] text-sm text-muted">
        The model reads every changed file. Large changes can take a few minutes; this page updates on its own.
      </p>
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-6" aria-hidden="true">
        <div className="sweep pointer-events-none absolute inset-x-0 top-0 h-7 bg-marker/35" />
        <div className="space-y-3 font-mono text-[0.8rem] text-muted/60">
          {[62, 80, 45, 70, 88, 38, 74, 56, 66, 50, 82, 40].map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-6 text-right tabular-nums">{i + 1}</span>
              <span className="h-2.5 rounded bg-surface-2" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Failed({ review: r }: { review: Review }) {
  return (
    <section className="mt-10 max-w-2xl rounded-2xl border border-blocker/40 bg-blocker/5 p-6">
      <h2 className="font-semibold">The review didn't finish</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {r.error ??
          "No result came back from n8n within 15 minutes. Open the n8n Executions tab to see which step failed; the usual causes are a stopped tunnel, an expired token, or Ollama not running."}
      </p>
    </section>
  );
}

function Results({ review: r }: { review: Review }) {
  const findings = useMemo(() => r.findings ?? [], [r.findings]);
  const counts = countBySeverity(findings);
  const [sev, setSev] = useState<Severity | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(findings.map((f) => f.category))], [findings]);
  const shown = findings.filter((f) => (!sev || f.severity === sev) && (!cat || f.category === cat));

  return (
    <>
      <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">Summary</h2>
            <RiskTag risk={r.risk} />
          </div>
          <p className="mt-3 max-w-[68ch] text-[1.02rem] leading-relaxed">
            <RichText text={r.summary ?? "No summary returned."} />
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm lg:grid-cols-1">
          <Fact term="Findings" value={plural(findings.length, "finding")} />
          {r.files != null && (
            <Fact
              term="Change size"
              value={
                <>
                  {plural(r.files, "file")}{" "}
                  <span className="text-muted">
                    +{r.additions ?? 0} −{r.deletions ?? 0}
                  </span>
                </>
              }
            />
          )}
          {r.model && <Fact term="Model" value={<span className="font-mono text-[0.82rem]">{r.model}</span>} />}
          <Fact
            term={`Comment on ${providerNoun(r.provider)}`}
            value={r.posted ? "Posted" : r.postComment ? "Not posted, check n8n" : "Not requested"}
          />
        </dl>
      </section>

      {findings.length > 0 && (
        <section aria-labelledby="findings-heading" className="mt-12">
          <h2 id="findings-heading" className="sr-only">
            Findings
          </h2>
          <SeverityBar counts={counts} total={findings.length} active={sev} onPick={(s) => setSev(s === sev ? null : s)} />

          {categories.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by area">
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={cat === c}
                  onClick={() => setCat(cat === c ? null : c)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    cat === c ? "border-ink bg-ink text-bg" : "border-line text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {CATEGORY_LABEL[c] ?? c}
                </button>
              ))}
            </div>
          )}

          <ol className="mt-6 space-y-4">
            {shown.map((f, i) => (
              <FindingCard key={`${f.file}:${f.line}:${i}`} finding={f} />
            ))}
          </ol>
          {shown.length === 0 && <p className="py-8 text-sm text-muted">No findings match these filters.</p>}
        </section>
      )}

      {findings.length === 0 && (
        <p className="mt-12 rounded-2xl border border-line bg-surface p-6 text-muted">
          Nothing worth flagging in this change. Deterministic checks (tsc, ESLint) still run in CI.
        </p>
      )}
    </>
  );
}

function Fact({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{term}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function SeverityBar({
  counts,
  total,
  active,
  onPick,
}: {
  counts: Record<Severity, number>;
  total: number;
  active: Severity | null;
  onPick: (s: Severity) => void;
}) {
  const present = SEVERITIES.filter((s) => counts[s] > 0);
  return (
    <div>
      <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full" aria-hidden="true">
        {present.map((s) => (
          <span
            key={s}
            className={`${SEV_BG[s]} rounded-full ${active && active !== s ? "opacity-25" : ""}`}
            style={{ flexGrow: counts[s], flexBasis: 0 }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Filter ${total} findings by severity`}>
        {present.map((s) => (
          <button
            key={s}
            aria-pressed={active === s}
            onClick={() => onPick(s)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
              active === s ? "border-ink bg-surface" : "border-transparent hover:border-line"
            }`}
          >
            <span className={`size-2 rounded-full ${SEV_BG[s]}`} aria-hidden="true" />
            <span className="tabular-nums font-medium">{counts[s]}</span>
            <span className="text-muted">{SEVERITY_LABEL[s]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FindingCard({ finding: f }: { finding: Finding }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="grid grid-cols-[4px_1fr] gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <span className={`w-1 rounded-full ${SEV_BG[f.severity]}`} aria-hidden="true" />
      <article className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className={`font-semibold ${SEV_TEXT[f.severity]}`}>{SEVERITY_LABEL[f.severity]}</span>
          <span className="text-muted">{CATEGORY_LABEL[f.category] ?? f.category}</span>
          {f.complexity && (
            <span className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.78rem]">{f.complexity}</span>
          )}
        </div>
        <h3 className="mt-2 text-[1.08rem] font-semibold leading-snug tracking-[-0.01em]">
          <RichText text={f.title} />
        </h3>
        {f.file && (
          <p className="mt-2 break-all font-mono text-[0.8rem]">
            <span className="marker">
              {f.file}
              {f.line ? `:${f.line}` : ""}
            </span>
          </p>
        )}
        {f.why && (
          <p className="mt-4 max-w-[70ch] leading-relaxed text-ink/90">
            <RichText text={f.why} />
          </p>
        )}
        {f.fix && (
          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium">Suggested fix</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(f.fix);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted hover:text-ink"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 max-w-[72ch] text-sm leading-relaxed">
              <RichText text={f.fix} />
            </p>
          </div>
        )}
      </article>
    </li>
  );
}
