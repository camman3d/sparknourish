import Link from "next/link";
import { Activity, Plus } from "lucide-react";
import { MealIcon, mealTint } from "./_components/MealIcon";
import { getMealsForDate, getMovementForDate } from "../db/queries";
import { requireUser } from "./_lib/auth";
import {
  dateKey,
  monthYearLabel,
  parseDateKey,
  todayUtc,
  weekDays,
} from "./_lib/calendar";
import { dailyMoveGoal } from "./_lib/movement";

// Reads the selected date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function DiaryPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;
  const selected = parseDateKey(requested) ?? todayUtc();
  const selectedKey = dateKey(selected);

  const user = await requireUser();
  const [{ meals, totals }, movement] = await Promise.all([
    getMealsForDate(user.id, selected),
    getMovementForDate(user.id, selected),
  ]);

  const days = weekDays(selected);

  // Exercise calories can be added back to the day's budget (Profile → Movement).
  const movementKcal = user.addExerciseToBudget ? movement.calories : 0;
  const budget = user.dailyCalorieGoal + movementKcal;
  const remaining = budget - totals.calories;
  const pct = Math.min(100, Math.round((totals.calories / Math.max(1, budget)) * 100));

  const dayGoal = dailyMoveGoal(user.weeklyMoveGoalMin);
  const movePct = dayGoal > 0 ? Math.min(100, Math.round((movement.minutes / dayGoal) * 100)) : 0;

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-forest-900">Diary</h1>
        <p className="pb-1 text-sm text-sand-500">{monthYearLabel(selected)}</p>
      </header>

      <div className="flex justify-between gap-1">
        {days.map((day) => (
          <Link
            key={day.key}
            href={`/?date=${day.key}`}
            aria-label={day.key}
            aria-current={day.isSelected ? "date" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-colors ${
              day.isSelected
                ? "bg-forest-700 text-white"
                : "text-sand-500 hover:bg-sand-200/60"
            }`}
          >
            <span className="text-xs font-medium">{day.weekday}</span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                day.isSelected ? "text-white" : day.isToday ? "text-forest-700" : "text-forest-900"
              }`}
            >
              {day.dayNumber}
            </span>
          </Link>
        ))}
      </div>

      <section className="card p-5">
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-2xl font-bold tabular-nums text-forest-900">
            {totals.calories.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-sand-500">
              of {budget.toLocaleString()} kcal
            </span>
          </p>
          <p
            className={`shrink-0 text-sm font-semibold ${
              remaining < 0 ? "text-coral-600" : "text-forest-700"
            }`}
          >
            {Math.abs(remaining).toLocaleString()} {remaining < 0 ? "over" : "left"}
          </p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
          <div
            className={`h-full rounded-full ${remaining < 0 ? "bg-coral-600" : "bg-forest-700"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {movementKcal > 0 && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-plum-100 px-3 py-1 text-xs font-semibold text-plum-700">
            <Activity className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />+{movementKcal} from
            moving
          </span>
        )}
      </section>

      {/* Movement summary */}
      <section className="card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-600">
            <Activity className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <Link href="/move" className="min-w-0 flex-1 font-semibold text-forest-900">
            Move
          </Link>
          <Link
            href="/move/log"
            aria-label="Log movement"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-700 transition-colors hover:bg-plum-200"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
        <Link href="/move" className="mt-2 block">
          <p className="font-display text-lg font-bold tabular-nums text-forest-900">
            {movement.minutes}
            <span className="ml-1 text-sm font-medium text-sand-500">
              {dayGoal > 0 ? `min of ${dayGoal}` : "min today"}
            </span>
          </p>
        </Link>
        {dayGoal > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-plum-100">
            <div className="h-full rounded-full bg-plum-600" style={{ width: `${movePct}%` }} />
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4">
        {meals.map((meal) => {
          const logged = meal.items.length > 0;

          if (!logged) {
            return (
              <Link
                key={meal.id}
                href={`/add-food?meal=${meal.id}&date=${selectedKey}`}
                className="flex items-center gap-3 rounded-card border border-dashed border-sand-300 p-4 transition-colors hover:border-forest-400"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile border border-dashed border-sand-300 text-sand-400">
                  <MealIcon meal={meal.id} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest-900">{meal.name}</p>
                  <p className="text-sm text-sand-500">Nothing logged yet</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Add
                </span>
              </Link>
            );
          }

          return (
            <section key={meal.id} className="card overflow-hidden">
              <Link
                href={`/meals/${meal.id}?date=${selectedKey}`}
                className="flex items-center gap-3 px-4 pt-4 transition-colors hover:opacity-90"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${mealTint[meal.id]}`}
                >
                  <MealIcon meal={meal.id} className="h-5 w-5" />
                </span>
                <p className="min-w-0 flex-1 font-display text-lg font-bold text-forest-900">
                  {meal.name}
                </p>
                <p className="shrink-0 font-display text-lg font-bold tabular-nums text-forest-900">
                  {meal.totals.calories}
                  <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                </p>
              </Link>

              <div className="mt-2 divide-y divide-sand-100 px-4">
                {meal.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-forest-900">{item.name}</p>
                      <p className="text-sm text-sand-500">{item.quantity}</p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums text-sand-600">
                      {item.calories}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
