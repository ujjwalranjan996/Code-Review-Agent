import type { Finding, Review, Severity } from "@/lib/types";
import { SEVERITIES, SEVERITY_LABEL } from "@/lib/types";

export const SEV_TEXT: Record<Severity, string> = {
  blocker: "text-blocker",
  major: "text-major",
  minor: "text-minor",
  suggestion: "text-suggestion",
};
export const SEV_BG: Record<Severity, string> = {
  blocker: "bg-blocker",
  major: "bg-major",
  minor: "bg-minor",
  suggestion: "bg-suggestion",
};

export function countBySeverity(findings: Finding[] = []): Record<Severity, number> {
  const c = { blocker: 0, major: 0, minor: 0, suggestion: 0 };
  for (const f of findings) c[f.severity]++;
  return c;
}

export function topSeverity(r: Review): Severity | null {
  const c = countBySeverity(r.findings);
  return SEVERITIES.find((s) => c[s] > 0) ?? null;
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function SeverityCounts({ findings }: { findings?: Finding[] }) {
  const c = countBySeverity(findings);
  const shown = SEVERITIES.filter((s) => c[s] > 0);
  if (!shown.length) return <span className="text-sm text-muted">No findings</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {shown.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${SEV_BG[s]}`} aria-hidden="true" />
          <span className="tabular-nums">{c[s]}</span>
          <span className="text-muted">{c[s] === 1 ? SEVERITY_LABEL[s].toLowerCase() : `${SEVERITY_LABEL[s].toLowerCase()}s`}</span>
        </span>
      ))}
    </span>
  );
}

export function RiskTag({ risk }: { risk?: Review["risk"] }) {
  if (!risk) return null;
  const tone =
    risk === "high"
      ? "border-blocker/40 text-blocker"
      : risk === "medium"
        ? "border-major/40 text-major"
        : "border-line-strong text-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {risk === "high" ? "High risk" : risk === "medium" ? "Medium risk" : "Low risk"}
    </span>
  );
}
