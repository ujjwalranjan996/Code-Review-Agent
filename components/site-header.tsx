import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./sign-out-button";

export function SiteHeader() {
  const locked = Boolean(process.env.APP_PASSWORD);
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="rounded-md" aria-label="Marker, all reviews">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {locked && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}
