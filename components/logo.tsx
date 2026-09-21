export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--ink)" />
        <rect x="6" y="8" width="11" height="2.2" rx="1.1" fill="var(--bg)" opacity="0.55" />
        <rect x="5" y="12.6" width="18" height="4.4" rx="1.4" fill="var(--marker)" />
        <rect x="6" y="19.6" width="14" height="2.2" rx="1.1" fill="var(--bg)" opacity="0.55" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-[-0.01em]">Marker</span>
    </span>
  );
}
