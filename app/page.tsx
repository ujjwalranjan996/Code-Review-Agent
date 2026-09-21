import { ReviewFeed } from "@/components/review-feed";
import { ReviewForm } from "@/components/review-form";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <div className="max-w-3xl">
          <h1 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[2.75rem]">
            Get a second look at any pull request.
          </h1>
          <p className="mt-4 max-w-[60ch] text-[1.05rem] leading-relaxed text-muted">
            Paste a GitHub pull request or GitLab merge request. A model running on your own machine reads the diff
            and flags bugs, security gaps, slow code and design problems, with a fix for each.
          </p>
        </div>
        <div className="mt-9 max-w-3xl">
          <ReviewForm />
        </div>
        <ReviewFeed />
      </main>
    </>
  );
}
