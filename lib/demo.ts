import type { Finding, Review } from "./types";

/**
 * Sample output used only when N8N_WEBHOOK_URL is not set, so the UI can be
 * explored before the pipeline is connected. Every demo review is flagged `demo: true`.
 */
const SAMPLE_FINDINGS: Finding[] = [
  {
    file: "src/features/sessions/SessionComments.tsx",
    line: 48,
    severity: "blocker",
    category: "security",
    title: "User comment rendered as raw HTML",
    why: "`dangerouslySetInnerHTML` receives `comment.body` straight from the API. Any rider or coach can store a script that runs in every viewer's session.",
    fix: "Render as text: `<p>{comment.body}</p>`. If rich text is required, sanitise first with DOMPurify: `DOMPurify.sanitize(comment.body)`.",
  },
  {
    file: "src/lib/auth/tokenStore.ts",
    line: 12,
    severity: "blocker",
    category: "security",
    title: "Refresh token persisted in localStorage",
    why: "Anything that runs JavaScript on the page can read localStorage, so one XSS bug hands over a long-lived refresh token.",
    fix: "Keep the access token in memory and have the API set the refresh token as an HttpOnly, Secure, SameSite=Strict cookie.",
  },
  {
    file: "src/features/sessions/useSessionMetrics.ts",
    line: 31,
    severity: "major",
    category: "performance",
    title: "Nested lookup inside map over every stride",
    why: "`strides.map(s => metrics.find(m => m.strideId === s.id))` scans all metrics for each stride. A 40-minute session has ~6,000 strides, so this is ~36M comparisons on every render.",
    fix: "Index once: `const byId = new Map(metrics.map(m => [m.strideId, m]));` then `strides.map(s => byId.get(s.id))`, wrapped in `useMemo`.",
    complexity: "O(n·m) → O(n + m)",
  },
  {
    file: "src/features/sessions/SessionFilters.tsx",
    line: 22,
    severity: "major",
    category: "react",
    title: "Effect reads `filters` but omits it from dependencies",
    why: "The fetch keeps using the first `filters` value, so changing the date range silently shows stale data.",
    fix: "Add `filters` to the dependency array, or move the fetch into a query hook keyed on `filters`.",
  },
  {
    file: "src/features/sessions/SessionTable.tsx",
    line: 67,
    severity: "major",
    category: "performance",
    title: "Full dataset copied into state on every keystroke",
    why: "`setRows([...allRows].filter(...))` clones the whole array per keypress and re-renders the full table.",
    fix: "Keep `allRows` as the single source, store only the query string, and derive rows with `useMemo` plus `useDeferredValue(query)`.",
    complexity: "O(n) memory per keystroke → O(1)",
  },
  {
    file: "src/components/HorseAvatar.tsx",
    line: 9,
    severity: "minor",
    category: "a11y",
    title: "Image has no alt text and is not lazy-loaded",
    why: "Screen readers announce the file name, and every avatar in a long list loads eagerly, hurting Largest Contentful Paint.",
    fix: "Give it a descriptive `alt` (the horse's name plus \"profile photo\"), add `loading=\"lazy\"`, and set `width` and `height` so the layout doesn't shift.",
  },
  {
    file: "src/features/sessions/SessionDetailsPage.tsx",
    line: 1,
    severity: "minor",
    category: "architecture",
    title: "412-line page mixes fetching, derived state and layout",
    why: "Data fetching, metric maths and JSX live in one component, which makes the logic hard to test and every change risky.",
    fix: "Extract `useSessionDetails(sessionId)` for data, move metric maths to `lib/metrics.ts`, and keep the page as composition only.",
  },
  {
    file: "src/features/sessions/api.ts",
    line: 18,
    severity: "suggestion",
    category: "types",
    title: "Response typed as `any`",
    why: "Callers lose autocomplete and type errors surface only at runtime.",
    fix: "Declare a `SessionResponse` interface, or validate with a zod schema and infer the type from it.",
  },
];

export function resolveDemo(r: Review): Review {
  return {
    ...r,
    status: "done",
    finishedAt: r.demoReadyAt,
    model: "sample data",
    title: r.title ?? "Session details: comments, filters and stride metrics",
    author: r.author ?? "demo-user",
    risk: "high",
    summary:
      "Adds comments and filtering to the session details page and computes per-stride metrics client-side. Two security issues need fixing before merge; the stride lookup will be slow on real session sizes.",
    findings: SAMPLE_FINDINGS,
    files: 9,
    additions: 486,
    deletions: 73,
    posted: false,
  };
}
