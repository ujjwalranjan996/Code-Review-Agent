/** Renders `inline code` spans from model output. No HTML is ever interpreted. */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <span className={`prose-code ${className}`}>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i}>{p.slice(1, -1)}</code> : <span key={i}>{p}</span>,
      )}
    </span>
  );
}
