import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pt-20 sm:px-8">
        <h1 className="text-2xl font-semibold">This page doesn&apos;t exist.</h1>
        <Link href="/" className="mt-4 inline-block text-muted underline underline-offset-4 hover:text-ink">
          Go to all reviews
        </Link>
      </main>
    </>
  );
}
