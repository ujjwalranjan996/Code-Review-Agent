import type { Metadata } from "next";
import { ReviewDetail } from "@/components/review-detail";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <ReviewDetail id={id} />
    </>
  );
}
