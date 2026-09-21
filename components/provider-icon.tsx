import { GitMerge, GitPullRequest } from "lucide-react";
import type { Provider } from "@/lib/types";

export function ProviderIcon({ provider, className = "size-4" }: { provider?: Provider | null; className?: string }) {
  const Icon = provider === "gitlab" ? GitMerge : GitPullRequest;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}

export function providerNoun(p?: Provider) {
  return p === "gitlab" ? "merge request" : "pull request";
}
