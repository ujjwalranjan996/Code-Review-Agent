import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/auth";
import { parsePrUrl } from "@/lib/pr-url";
import { upsertReview } from "@/lib/store";
import { SEVERITIES, type Finding, type Review, type Severity } from "@/lib/types";

export const dynamic = "force-dynamic";

/** n8n posts review status and results here. Authenticated with the shared REVIEW_SECRET. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVIEW_SECRET;
  const got = req.headers.get("x-review-secret") ?? "";
  if (!secret || !safeEqual(got, secret)) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.id !== "string" || !b.id) {
    return NextResponse.json({ error: "Body must include an id." }, { status: 400 });
  }

  const patch: Partial<Review> & { id: string } = { id: b.id.slice(0, 80) };
  const pr = typeof b.url === "string" ? parsePrUrl(b.url) : null;
  if (pr) Object.assign(patch, { url: pr.url, provider: pr.provider, repo: pr.repo, number: pr.number });

  const str = (k: string, max = 4000) => (typeof b[k] === "string" ? (b[k] as string).slice(0, max) : undefined);
  const num = (k: string) => (typeof b[k] === "number" && Number.isFinite(b[k]) ? (b[k] as number) : undefined);

  if (b.status === "running" || b.status === "done" || b.status === "failed") patch.status = b.status;
  if (b.risk === "low" || b.risk === "medium" || b.risk === "high") patch.risk = b.risk;
  patch.title = str("title", 300);
  patch.author = str("author", 100);
  patch.summary = str("summary");
  patch.model = str("model", 100);
  patch.source = str("source", 40);
  patch.error = str("error", 1000);
  patch.createdAt = num("createdAt");
  patch.finishedAt = num("finishedAt");
  patch.files = num("files");
  patch.additions = num("additions");
  patch.deletions = num("deletions");
  if (typeof b.posted === "boolean") patch.posted = b.posted;
  if (typeof b.postComment === "boolean") patch.postComment = b.postComment;
  if (Array.isArray(b.findings)) patch.findings = b.findings.slice(0, 50).map(toFinding).filter(Boolean) as Finding[];

  const review = await upsertReview(patch);
  return NextResponse.json({ ok: true, id: review.id });
}

function toFinding(x: unknown): Finding | null {
  if (!x || typeof x !== "object") return null;
  const f = x as Record<string, unknown>;
  const sev = String(f.severity ?? "").toLowerCase() as Severity;
  const s = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
  if (!s(f.title)) return null;
  return {
    file: s(f.file, 300),
    line: typeof f.line === "number" ? f.line : null,
    severity: SEVERITIES.includes(sev) ? sev : "suggestion",
    category: s(f.category, 40).toLowerCase() || "maintainability",
    title: s(f.title, 300),
    why: s(f.why),
    fix: s(f.fix),
    complexity: s(f.complexity, 60) || undefined,
  };
}
