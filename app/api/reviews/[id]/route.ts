import { NextResponse } from "next/server";
import { getReview } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  return NextResponse.json({ review }, { headers: { "Cache-Control": "no-store" } });
}
