import Link from "next/link";
import { MacroBar } from "../_components/MacroBar";
import {
  daysOnTarget,
  historyAverages,
  mealAverageBreakdown,
  peakDay,
  type HistoryRange,
} from "../_lib/mock-data";
import { getHistory } from "../../db/queries";
import { requireUser } from "../_lib/auth";
import { CalorieDeltaChart } from "./CalorieDeltaChart";
import { MealBreakdownBar } from "./MealBreakdownBar";

// Reads today's date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function HistoryPage(props: PageProps<"/history">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: HistoryRange = requested === "30" ? 30 : 7;

  const user = await requireUser();
  const days = await getHistory(user.id, range);
  const averages = historyAverages(days);
  const breakdown = mealAverageBreakdown(days);
  const onTarget = daysOnTarget(days, user.dailyCalorieGoal);
  const peak = peakDay(days);
  const calorieDelta = averages.calories - user.dailyCalorieGoal;

  return (
    <main className="flex flex-col gap-6 px-5 pb-8 pt-8">
      <header>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Trends</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Your history</h1>
      </header>

      <div className="flex gap-2">
        {([7, 30] as const).map((option) => (
          <Link
            key={option}
            href={`/history?range=${option}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              range === option
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Last {option} days
          </Link>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg calories/day</p>
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {averages.calories.toLocaleString()}
          </p>
          <p
            className="text-xs font-medium"
            style={{ color: calorieDelta <= 0 ? "#0ca30c" : "#d03b3b" }}
          >
            {calorieDelta > 0 ? "+" : ""}
            {calorieDelta.toLocaleString()} vs goal
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg protein/day</p>
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{averages.protein}g</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">goal {user.proteinGoalG}g</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Days on target</p>
          <p className="text-xl font-semibold tabular-nums" style={{ color: "#0ca30c" }}>
            {onTarget}
            <span className="text-zinc-400 dark:text-zinc-500">/{days.length}</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">within 10% of goal</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Peak day</p>
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {peak.calories.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {peak.weekday}, {peak.label}
          </p>
        </div>
      </section>

      <CalorieDeltaChart days={days} goal={user.dailyCalorieGoal} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Average macros/day</h3>
        <div className="flex flex-col gap-3">
          <MacroBar label="Protein" grams={averages.protein} goalGrams={user.proteinGoalG} kind="protein" />
          <MacroBar label="Carbs" grams={averages.carbs} goalGrams={user.carbsGoalG} kind="carbs" />
          <MacroBar label="Fat" grams={averages.fat} goalGrams={user.fatGoalG} kind="fat" />
        </div>
      </section>

      <MealBreakdownBar breakdown={breakdown} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Daily log</h2>
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-2 py-2 text-right font-medium">Kcal</th>
                <th className="px-2 py-2 text-right font-medium">P</th>
                <th className="px-2 py-2 text-right font-medium">C</th>
                <th className="px-4 py-2 text-right font-medium">F</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {[...days].reverse().map((day) => {
                const onGoal = Math.abs(day.calories - user.dailyCalorieGoal) <= user.dailyCalorieGoal * 0.1;
                return (
                  <tr key={day.date}>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: onGoal ? "#0ca30c" : "#d03b3b" }}
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {day.weekday} {day.label}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                      {day.calories.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {day.protein}g
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {day.carbs}g
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {day.fat}g
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
