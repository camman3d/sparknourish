import Link from "next/link";
import { Droplet, Flame, Leaf } from "lucide-react";
import {
  dayStreak,
  historyAverages,
  macroSplitCalories,
  type HistoryRange,
} from "../_lib/mock-data";
import { getHistory } from "../../db/queries";
import { requireUser } from "../_lib/auth";
import { CalorieBars } from "./CalorieBars";
import { MacroSplit } from "./MacroSplit";

// Reads today's date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

const RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: 7, label: "Week" },
  { value: 30, label: "Month" },
  { value: 90, label: "3 months" },
];

export default async function HistoryPage(props: PageProps<"/history">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: HistoryRange = requested === "30" ? 30 : requested === "90" ? 90 : 7;

  const user = await requireUser();
  const days = await getHistory(user.id, range);
  const averages = historyAverages(days);
  const streak = dayStreak(days);
  const split = macroSplitCalories(averages);

  const rangeLabel = `${days[0].label} – ${days[days.length - 1].label}`;
  const proteinGap = Math.max(0, user.proteinGoalG - averages.protein);

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <h1 className="font-display text-4xl font-bold text-forest-900">Progress</h1>

      <div className="flex rounded-full bg-sand-200/80 p-1">
        {RANGE_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`/history?range=${option.value}`}
            className={`flex-1 rounded-full py-2 text-center text-sm transition-colors ${
              range === option.value
                ? "bg-white font-semibold text-forest-900 shadow-sm"
                : "font-medium text-sand-600 hover:text-forest-800"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <section className="card p-5">
        <p className="text-sm text-sand-500">Daily average · {rangeLabel}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="font-display text-4xl font-bold tabular-nums leading-none text-forest-900">
            {averages.calories.toLocaleString()}
            <span className="ml-1 text-base font-medium text-sand-500">kcal</span>
          </p>
          <p className="pb-1 text-sm text-sand-500">Goal {user.dailyCalorieGoal.toLocaleString()}</p>
        </div>

        <CalorieBars days={days} goal={user.dailyCalorieGoal} />
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="tile p-4">
          <Flame className="h-5 w-5 text-coral-600" strokeWidth={1.75} aria-hidden />
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-forest-900">{streak}</p>
          <p className="text-sm text-sand-500">day streak</p>
        </div>

        <div className="tile p-4">
          <p className="font-display text-base font-bold text-forest-700">P</p>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-forest-900">
            {averages.protein}
            <span className="text-base font-medium text-sand-500">g</span>
          </p>
          <p className="text-sm text-sand-500">avg protein</p>
        </div>

        <div className="tile p-4">
          <Droplet className="h-5 w-5 text-lagoon-600" strokeWidth={1.75} aria-hidden />
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-forest-900">
            {averages.water}
            <span className="text-base font-medium text-sand-500">oz</span>
          </p>
          <p className="text-sm text-sand-500">avg water</p>
        </div>
      </section>

      <MacroSplit split={split} />

      <section className="flex items-start gap-3 rounded-card bg-forest-50 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 text-forest-100">
          <Leaf className="h-5.5 w-5.5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          {proteinGap > 0 ? (
            <>
              <p className="font-display text-lg font-bold text-forest-900">Protein is your gap</p>
              <p className="text-sm text-sand-600">
                {proteinGap}g under goal on average. A yogurt at breakfast adds 17g.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-bold text-forest-900">Protein on target</p>
              <p className="text-sm text-sand-600">
                You&apos;re averaging {averages.protein}g, right at your {user.proteinGoalG}g goal.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
