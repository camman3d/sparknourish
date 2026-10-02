"use client";

import { useState } from "react";
import { MealIcon } from "../_components/MealIcon";
import type { MealId } from "../_lib/mock-data";

const SEGMENTS: { id: MealId; name: string; light: string; dark: string }[] = [
  { id: "breakfast", name: "Breakfast", light: "#2a78d6", dark: "#3987e5" },
  { id: "lunch", name: "Lunch", light: "#eb6834", dark: "#d95926" },
  { id: "dinner", name: "Dinner", light: "#1baf7a", dark: "#199e70" },
  { id: "snacks", name: "Snacks", light: "#eda100", dark: "#c98500" },
];

export function MealBreakdownBar({ breakdown }: { breakdown: Record<MealId, number> }) {
  const [active, setActive] = useState<MealId | null>(null);
  const total = SEGMENTS.reduce((sum, s) => sum + breakdown[s.id], 0) || 1;

  return (
    <div className="meal-breakdown-bar rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Average calories by meal</h3>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Where your calories typically come from each day</p>

      <div className="flex h-8 gap-[2px] overflow-hidden rounded-lg">
        {SEGMENTS.map((segment) => {
          const value = breakdown[segment.id];
          const pct = (value / total) * 100;
          return (
            <button
              key={segment.id}
              type="button"
              className="group relative h-full transition-opacity hover:opacity-85 focus-visible:opacity-85"
              style={{ width: `${pct}%`, backgroundColor: `var(--seg-${segment.id})` }}
              onMouseEnter={() => setActive(segment.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(segment.id)}
              onBlur={() => setActive(null)}
              aria-label={`${segment.name}: ${value} kcal average, ${Math.round(pct)}%`}
            >
              {pct >= 12 && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {Math.round(pct)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {breakdown[active].toLocaleString()} kcal
          </span>{" "}
          avg · {SEGMENTS.find((s) => s.id === active)?.name}
        </p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {SEGMENTS.map((segment) => (
          <li key={segment.id} className="flex items-center gap-2">
            <span className="shrink-0" style={{ color: `var(--seg-${segment.id})` }}>
              <MealIcon meal={segment.id} className="h-4 w-4" />
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">{segment.name}</span>
            <span className="ml-auto tabular-nums text-zinc-500 dark:text-zinc-400">
              {breakdown[segment.id].toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <style>{`
        .meal-breakdown-bar {
          ${SEGMENTS.map((s) => `--seg-${s.id}: ${s.light};`).join(" ")}
        }
        @media (prefers-color-scheme: dark) {
          .meal-breakdown-bar {
            ${SEGMENTS.map((s) => `--seg-${s.id}: ${s.dark};`).join(" ")}
          }
        }
      `}</style>
    </div>
  );
}
