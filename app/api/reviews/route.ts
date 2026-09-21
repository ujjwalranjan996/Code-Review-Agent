import { NextResponse } from "next/server";
import { listReviews, storeKind } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await listReviews(50);
  return NextResponse.json(
    { reviews, store: storeKind, connected: Boolean(process.env.N8N_WEBHOOK_URL) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
