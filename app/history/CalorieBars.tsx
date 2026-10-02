import type { DayLog } from "../_lib/mock-data";

/**
 * Vertical daily-calorie bars scaled against the user's goal. Days without
 * data render as faint placeholder pills; over-goal days turn coral.
 */
export function CalorieBars({ days, goal }: { days: DayLog[]; goal: number }) {
  const maxValue = Math.max(goal, ...days.map((day) => day.calories), 1);
  const scaleMax = maxValue * 1.12;
  const goalTopPct = (1 - goal / scaleMax) * 100;
  const labelStride = Math.max(1, Math.ceil(days.length / 7));
  const barGap = days.length <= 10 ? "gap-2" : days.length <= 30 ? "gap-1" : "gap-[2px]";

  return (
    <div className="mt-5">
      <div className="relative h-40">
        <div
          className="absolute inset-x-0 border-t border-dashed border-sand-300"
          style={{ top: `${goalTopPct}%` }}
        />
        <div className={`flex h-full items-end ${barGap}`}>
          {days.map((day) => {
            const hasData = day.calories > 0;
            const heightPct = hasData ? Math.max(4, (day.calories / scaleMax) * 100) : 14;
            const over = day.calories > goal;
            return (
              <div key={day.date} className="flex h-full flex-1 items-end">
                <div
                  title={`${day.weekday} ${day.label}: ${day.calories.toLocaleString()} kcal`}
                  className={`mx-auto w-full max-w-[22px] rounded-full ${
                    !hasData ? "bg-sand-200" : over ? "bg-coral-600" : "bg-forest-700"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-2 flex ${barGap}`}>
        {days.map((day, i) => (
          <div key={day.date} className="flex-1 text-center text-[11px] text-sand-500">
            {i % labelStride === 0 ? (days.length <= 10 ? day.weekday : day.label.split(" ")[1]) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
