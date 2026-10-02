import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from "lucide-react";
import { BrandMark } from "./_components/BrandMark";
import { CalorieRing } from "./_components/CalorieRing";
import { MacroBar } from "./_components/MacroBar";
import { MealIcon, mealTint } from "./_components/MealIcon";
import { MoveTile } from "./_components/MoveTile";
import { WaterTracker } from "./_components/WaterTracker";
import { getMealsForDate, getMovementForDate, getWaterForDate } from "../db/queries";
import { requireUser } from "./_lib/auth";
import {
  addDays,
  dateKey,
  hourInTimeZone,
  parseDateKey,
  resolveTimeZone,
  shortDateLabel,
  todayKey,
  todayMarker,
} from "./_lib/calendar";
import { dailyMoveGoal } from "./_lib/movement";

// Reads the selected date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function HomePage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;

  const user = await requireUser();
  const timeZone = resolveTimeZone(user.timezone);
  const selected = parseDateKey(requested) ?? todayMarker(timeZone);
  const selectedKey = dateKey(selected);

  const [{ meals, totals }, movement, water] = await Promise.all([
    getMealsForDate(user.id, selected, timeZone),
    getMovementForDate(user.id, selected, timeZone),
    getWaterForDate(user.id, selected, timeZone),
  ]);

  // Exercise calories can be added back to the day's budget (Profile → Movement).
  const movementKcal = user.addExerciseToBudget ? movement.calories : 0;
  const budget = user.dailyCalorieGoal + movementKcal;
  const remaining = Math.max(0, budget - totals.calories);
  const pct = Math.min(100, Math.round((totals.calories / Math.max(1, budget)) * 100));

  const dayGoal = dailyMoveGoal(user.weeklyMoveGoalMin);

  const prevKey = dateKey(addDays(selected, -1));
  const nextKey = dateKey(addDays(selected, 1));

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(selected);

  const now = new Date();
  const hour = hourInTimeZone(now, timeZone);
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  const isToday = selectedKey === todayKey(timeZone);
  const mealsHeading = isToday ? "Today's meals" : `Meals for ${shortDateLabel(selected)}`;

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <div className="min-w-0">
            {/* Compact date picker — the week strip was dropped to match the design. */}
            <div className="flex items-center gap-0.5">
              <Link
                href={`/?date=${prevKey}`}
                aria-label="Previous day"
                className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-200/60 hover:text-forest-700"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </Link>
              <p className="text-sm text-sand-500">{dateLabel}</p>
              <Link
                href={`/?date=${nextKey}`}
                aria-label="Next day"
                className="-mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-200/60 hover:text-forest-700"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight text-forest-900">
              {greeting}, {firstName}
            </h1>
          </div>
        </div>
        <Link
          href="/profile"
          aria-label="Profile settings"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </Link>
      </header>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <CalorieRing pct={pct} label={movementKcal > 0 ? "of budget" : "of goal"} />
          <div className="min-w-0 text-right">
            <p className="text-sm text-sand-500">Remaining today</p>
            <p className="font-display text-4xl font-bold tabular-nums leading-none text-forest-900">
              {remaining.toLocaleString()}
              <span className="ml-1 text-base font-medium text-sand-500">kcal</span>
            </p>
            {movementKcal > 0 ? (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-plum-100 px-3 py-1 text-xs font-semibold text-plum-700">
                <Activity className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />+{movementKcal} from
                moving
              </span>
            ) : (
              <p className="mt-2 text-sm text-sand-500">
                {totals.calories.toLocaleString()} eaten · {user.dailyCalorieGoal.toLocaleString()} goal
              </p>
            )}
          </div>
        </div>

        <hr className="my-5 border-sand-200" />

        <div className="grid grid-cols-3 gap-4">
          <MacroBar label="Protein" grams={totals.protein} goalGrams={user.proteinGoalG} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} goalGrams={user.carbsGoalG} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} goalGrams={user.fatGoalG} kind="fat" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <WaterTracker consumedOz={water.totalOz} goalOz={user.waterGoalOz} date={selectedKey} />
        <MoveTile minutes={movement.minutes} goalMin={dayGoal} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-forest-900">{mealsHeading}</h2>
          <Link
            href={`/meals?date=${selectedKey}`}
            className="text-sm font-semibold text-forest-700 transition-colors hover:text-forest-900"
          >
            View all
          </Link>
        </div>

        <div className="card divide-y divide-sand-100 px-4">
          {meals.map((meal) => {
            const logged = meal.items.length > 0;
            const badge = logged
              ? mealTint[meal.id]
              : "border border-dashed border-sand-300 text-sand-400";

            return (
              <div key={meal.id} className="flex items-center gap-3 py-3.5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${badge}`}
                >
                  <MealIcon meal={meal.id} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest-900">{meal.name}</p>
                  <p className="truncate text-sm text-sand-500">
                    {logged
                      ? `${Math.round(meal.totals.protein)}P · ${Math.round(
                          meal.totals.carbs
                        )}C · ${Math.round(meal.totals.fat)}F`
                      : "Not logged yet"}
                  </p>
                </div>
                {logged ? (
                  <Link
                    href={`/meals/${meal.id}?date=${selectedKey}`}
                    className="shrink-0 font-display text-lg font-bold tabular-nums text-forest-900 transition-colors hover:text-forest-700"
                  >
                    {meal.totals.calories}
                    <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                  </Link>
                ) : (
                  <Link
                    href={`/add-food?meal=${meal.id}&date=${selectedKey}`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-700"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    Add
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
