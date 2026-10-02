import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MacroBar } from "../_components/MacroBar";
import { MealIcon, mealTint } from "../_components/MealIcon";
import { getMealsForDate } from "../../db/queries";
import { requireUser } from "../_lib/auth";
import { addDays, dateKey, parseDateKey, todayUtc } from "../_lib/calendar";

// Reads the selected date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function AllMealsPage(props: PageProps<"/meals">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;
  const selected = parseDateKey(requested) ?? todayUtc();
  const dateParam = dateKey(selected);

  const user = await requireUser();
  const { meals, totals } = await getMealsForDate(user.id, selected);

  const remaining = user.dailyCalorieGoal - totals.calories;
  const prevKey = dateKey(addDays(selected, -1));
  const nextKey = dateKey(addDays(selected, 1));

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(selected);

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/?date=${dateParam}`}
          aria-label="Back to home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-forest-900">All meals</h1>
          <div className="flex items-center gap-0.5">
            <Link
              href={`/meals?date=${prevKey}`}
              aria-label="Previous day"
              className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-200/60 hover:text-forest-700"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </Link>
            <p className="text-sm text-sand-500">{dateLabel}</p>
            <Link
              href={`/meals?date=${nextKey}`}
              aria-label="Next day"
              className="-mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-200/60 hover:text-forest-700"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Day summary */}
      <section className="card p-5">
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-3xl font-bold tabular-nums leading-none text-forest-900">
            {totals.calories.toLocaleString()}
            <span className="ml-1 text-base font-medium text-sand-500">
              of {user.dailyCalorieGoal.toLocaleString()} kcal
            </span>
          </p>
          <p
            className={`shrink-0 pb-0.5 text-sm font-semibold ${
              remaining < 0 ? "text-coral-600" : "text-forest-700"
            }`}
          >
            {Math.abs(remaining).toLocaleString()} {remaining < 0 ? "over" : "left"}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <MacroBar label="Protein" grams={totals.protein} goalGrams={user.proteinGoalG} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} goalGrams={user.carbsGoalG} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} goalGrams={user.fatGoalG} kind="fat" />
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {meals.map((meal) => {
          const logged = meal.items.length > 0;

          if (!logged) {
            return (
              <Link
                key={meal.id}
                href={`/add-food?meal=${meal.id}&date=${dateParam}`}
                className="flex items-center gap-3 rounded-card border border-dashed border-sand-300 p-4 transition-colors hover:border-forest-400"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile border border-dashed border-sand-300 text-sand-400">
                  <MealIcon meal={meal.id} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest-900">{meal.name}</p>
                  <p className="text-sm text-sand-500">Not logged yet</p>
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
                href={`/meals/${meal.id}?date=${dateParam}`}
                className="flex items-center gap-3 px-4 pt-4 transition-colors hover:opacity-90"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${mealTint[meal.id]}`}
                >
                  <MealIcon meal={meal.id} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-forest-900">{meal.name}</p>
                  <p className="text-sm text-sand-500">
                    {meal.items.length} {meal.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <p className="shrink-0 font-display text-lg font-bold tabular-nums text-forest-900">
                  {meal.totals.calories}
                  <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                </p>
              </Link>

              <div className="mt-2 divide-y divide-sand-100 px-4 pb-1">
                {meal.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-forest-900">{item.name}</p>
                      <p className="text-sm text-sand-500">{item.quantity}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium tabular-nums text-forest-900">
                        {item.calories}
                        <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                      </p>
                      <p className="text-xs text-sand-400">
                        {Math.round(item.proteinG)}P · {Math.round(item.carbsG)}C ·{" "}
                        {Math.round(item.fatG)}F
                      </p>
                    </div>
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
