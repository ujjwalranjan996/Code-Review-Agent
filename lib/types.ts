export type Provider = "github" | "gitlab";
export type Severity = "blocker" | "major" | "minor" | "suggestion";
export type Risk = "low" | "medium" | "high";
export type ReviewStatus = "running" | "done" | "failed";
export type Category =
  | "security"
  | "performance"
  | "architecture"
  | "maintainability"
  | "react"
  | "a11y"
  | "types"
  | "lint";

export interface Finding {
  file: string;
  line: number | null;
  severity: Severity;
  category: Category | string;
  title: string;
  why: string;
  fix: string;
  complexity?: string;
}

export interface Review {
  id: string;
  url: string;
  provider: Provider;
  repo: string;
  number: number;
  title?: string;
  author?: string;
  status: ReviewStatus;
  source: string;
  createdAt: number;
  finishedAt?: number;
  model?: string;
  summary?: string;
  risk?: Risk;
  findings?: Finding[];
  files?: number;
  additions?: number;
  deletions?: number;
  posted?: boolean;
  postComment?: boolean;
  error?: string;
  demo?: boolean;
  demoReadyAt?: number;
}

export const SEVERITIES: Severity[] = ["blocker", "major", "minor", "suggestion"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  blocker: "Blocker",
  major: "Major",
  minor: "Minor",
  suggestion: "Suggestion",
};

export const CATEGORY_LABEL: Record<string, string> = {
  security: "Security",
  performance: "Performance",
  architecture: "Architecture",
  maintainability: "Maintainability",
  react: "React",
  a11y: "Accessibility",
  types: "Types",
  lint: "Lint",
};

/** A review still marked running after this long is treated as lost. */
export const STALE_AFTER_MS = 15 * 60 * 1000;
