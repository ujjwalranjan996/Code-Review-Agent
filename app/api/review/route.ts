import { NextRequest, NextResponse } from "next/server";
import { parsePrUrl } from "@/lib/pr-url";
import { upsertReview } from "@/lib/store";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Starts a review. Returns immediately; n8n reports the result to /api/reviews/ingest. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { url?: string; postComment?: boolean } | null;
  const pr = body?.url ? parsePrUrl(body.url) : null;
  if (!pr) {
    return NextResponse.json(
      { error: "Paste a GitHub pull request or GitLab merge request link." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const base: Review = {
    id,
    url: pr.url,
    provider: pr.provider,
    repo: pr.repo,
    number: pr.number,
    status: "running",
    source: "dashboard",
    createdAt: Date.now(),
    postComment: body?.postComment ?? false,
  };

  const webhook = process.env.N8N_WEBHOOK_URL;
  if (!webhook) {
    const review = await upsertReview({ ...base, demo: true, demoReadyAt: Date.now() + 7000 });
    return NextResponse.json({ review }, { status: 202 });
  }

  await upsertReview(base);
  const origin = (process.env.APP_URL ?? req.nextUrl.origin).replace(/\/$/, "");

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Review-Secret": process.env.REVIEW_SECRET ?? "",
      },
      body: JSON.stringify({
        id,
        url: pr.url,
        postComment: base.postComment,
        source: "dashboard",
        callbackUrl: `${origin}/api/reviews/ingest`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`n8n answered ${res.status}. Check that the workflow is active and the secret matches.`);
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "n8n did not answer within 15 seconds. Check that the tunnel and n8n are running."
        : err instanceof Error
          ? err.message
          : "Could not reach n8n.";
    const review = await upsertReview({ id, status: "failed", error: message, finishedAt: Date.now() });
    return NextResponse.json({ review }, { status: 502 });
  }

  return NextResponse.json({ review: base }, { status: 202 });
}
