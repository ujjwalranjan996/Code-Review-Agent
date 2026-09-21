"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Enable colour transitions only after the first paint so the page never flashes.
    const t = requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {children}
    </NextThemes>
  );
}
