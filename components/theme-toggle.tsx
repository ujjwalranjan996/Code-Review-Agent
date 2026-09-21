"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Match system", Icon: Monitor },
] as const;

const noop = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center rounded-full border border-line bg-surface p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`grid size-7 place-items-center rounded-full ${
              active ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="size-3.5" strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
