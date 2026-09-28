"use client";

import { useState } from "react";
import type { DayLog } from "../_lib/mock-data";

const OVER = "#e34948";
const OVER_DARK = "#e66767";
const UNDER = "#2a78d6";
const UNDER_DARK = "#3987e5";

export function CalorieDeltaChart({ days, goal }: { days: DayLog[]; goal: number }) {
  const [active, setActive] = useState<number | null>(null);

  const deltas = days.map((day) => day.calories - goal);
  const maxAbs = Math.max(300, ...deltas.map((d) => Math.abs(d)));
  const labelStride = days.length <= 10 ? 1 : Math.ceil(days.length / 6);
  const chartHeight = 144;
  const half = chartHeight / 2;
  const activeDay = active !== null ? days[active] : null;
  const activeDelta = active !== null ? deltas[active] : null;

  return (
    <div className="calorie-delta-chart rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Calories vs. goal</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Daily intake relative to your {goal.toLocaleString()} kcal goal</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: UNDER }} />
          Under goal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: OVER }} />
          Over goal
        </span>
      </div>

      <div className="relative mt-4" style={{ height: chartHeight }}>
        {activeDay && activeDelta !== null && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[85vw] whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            style={{
              left: `${Math.min(88, Math.max(12, ((active! + 0.5) / days.length) * 100))}%`,
              transform: "translate(-50%, -100%)",
              top: half - (activeDelta >= 0 ? (activeDelta / maxAbs) * half : -(Math.abs(activeDelta) / maxAbs) * half) - 8,
            }}
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{activeDay.calories.toLocaleString()} kcal</p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {activeDay.weekday}, {activeDay.label} ·{" "}
              <span className={activeDelta > 0 ? "text-[#d03b3b] dark:text-[#e66767]" : "text-[#2a78d6] dark:text-[#3987e5]"}>
                {activeDelta > 0 ? "+" : ""}
                {activeDelta.toLocaleString()} vs goal
              </span>
            </p>
          </div>
        )}

        <div
          className="absolute left-0 right-0 border-t border-dashed border-zinc-300 dark:border-zinc-700"
          style={{ top: half }}
        >
          <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[10px] text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
            goal
          </span>
        </div>

        <div className="flex h-full items-stretch gap-[2px]">
          {days.map((day, i) => {
            const delta = deltas[i];
            const barHeight = Math.max(2, (Math.abs(delta) / maxAbs) * half);
            const isOver = delta >= 0;
            return (
              <button
                key={day.date}
                type="button"
                className="group relative flex-1"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${day.weekday} ${day.label}: ${day.calories} calories, ${isOver ? "+" : ""}${delta} vs goal`}
              >
                <span
                  className="absolute left-1/2 w-full max-w-[20px] -translate-x-1/2 rounded-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{
                    height: barHeight,
                    top: isOver ? half - barHeight : half,
                    backgroundColor: isOver ? "var(--chart-over)" : "var(--chart-under)",
                    outline: active === i ? "2px solid var(--chart-ring)" : undefined,
                    outlineOffset: 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-[2px]">
        {days.map((day, i) => (
          <div key={day.date} className="flex-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            {i % labelStride === 0 ? (days.length <= 10 ? day.weekday.slice(0, 1) : day.label.split(" ")[1]) : ""}
          </div>
        ))}
      </div>

      <style>{`
        .calorie-delta-chart { --chart-over: ${OVER}; --chart-under: ${UNDER}; --chart-ring: #898781; }
        @media (prefers-color-scheme: dark) {
          .calorie-delta-chart { --chart-over: ${OVER_DARK}; --chart-under: ${UNDER_DARK}; }
        }
      `}</style>
    </div>
  );
}
