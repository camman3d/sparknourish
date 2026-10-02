import Link from "next/link";
import { Leaf, Plus, SlidersHorizontal } from "lucide-react";
import { CalorieRing } from "./_components/CalorieRing";
import { MacroBar } from "./_components/MacroBar";
import { MealIcon, mealTint } from "./_components/MealIcon";
import { WaterTracker } from "./_components/WaterTracker";
import { getTodayMeals } from "../db/queries";
import { requireUser } from "./_lib/auth";

// Reads today's date and live food-log data — must render per-request, not
// get frozen into a static page at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const { meals, totals } = await getTodayMeals(user.id);

  const remaining = Math.max(0, user.dailyCalorieGoal - totals.calories);
  const pct = Math.min(100, Math.round((totals.calories / user.dailyCalorieGoal) * 100));

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-800 text-forest-100">
            <Leaf className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-sm text-sand-500">{dateLabel}</p>
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
          <CalorieRing pct={pct} />
          <div className="min-w-0 text-right">
            <p className="text-sm text-sand-500">Remaining today</p>
            <p className="font-display text-4xl font-bold tabular-nums leading-none text-forest-900">
              {remaining.toLocaleString()}
              <span className="ml-1 text-base font-medium text-sand-500">kcal</span>
            </p>
            <p className="mt-2 text-sm text-sand-500">
              {totals.calories.toLocaleString()} eaten · {user.dailyCalorieGoal.toLocaleString()} goal
            </p>
          </div>
        </div>

        <hr className="my-5 border-sand-200" />

        <div className="grid grid-cols-3 gap-4">
          <MacroBar label="Protein" grams={totals.protein} goalGrams={user.proteinGoalG} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} goalGrams={user.carbsGoalG} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} goalGrams={user.fatGoalG} kind="fat" />
        </div>
      </section>

      <WaterTracker goalOz={80} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-forest-900">Today&apos;s meals</h2>
          {/* No dedicated all-meals view exists yet — intentional no-op. */}
          <button
            type="button"
            title="All-meals view is coming soon"
            className="text-sm font-semibold text-forest-700"
          >
            View all
          </button>
        </div>

        <div className="card divide-y divide-sand-100 px-4">
          {meals.map((meal) => {
            const logged = meal.items.length > 0;
            const badge = logged
              ? mealTint[meal.id]
              : "border border-dashed border-sand-300 text-sand-400";

            const row = (
              <div className="flex items-center gap-3 py-3.5">
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
                  <p className="shrink-0 font-display text-lg font-bold tabular-nums text-forest-900">
                    {meal.totals.calories}
                    <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                  </p>
                ) : (
                  <Link
                    href={`/add-food?meal=${meal.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-700"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    Add
                  </Link>
                )}
              </div>
            );

            return logged ? (
              <Link
                key={meal.id}
                href={`/meals/${meal.id}`}
                className="-mx-4 block px-4 transition-colors hover:bg-sand-50"
              >
                {row}
              </Link>
            ) : (
              <div key={meal.id}>{row}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
