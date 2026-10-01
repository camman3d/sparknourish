import Link from "next/link";
import { MacroBar } from "./_components/MacroBar";
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
    <main className="flex flex-col gap-6 px-5 pb-8 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dateLabel}</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {greeting}, {firstName}
          </h1>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4.5 w-4.5">
            <circle cx="12" cy="8" r="3.5" />
            <path strokeLinecap="round" d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          </svg>
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {remaining.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">calories remaining</p>
          </div>
          <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
            <p className="tabular-nums text-zinc-900 dark:text-zinc-50">
              {totals.calories.toLocaleString()}
              <span className="text-zinc-400 dark:text-zinc-500">
                {" "}
                / {user.dailyCalorieGoal.toLocaleString()}
              </span>
            </p>
            <p>eaten today</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <MacroBar label="Protein" grams={totals.protein} goalGrams={user.proteinGoalG} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} goalGrams={user.carbsGoalG} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} goalGrams={user.fatGoalG} kind="fat" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s meals</h2>
          <Link
            href="/add-food"
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            + Add food
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <Link
              key={meal.id}
              href={`/meals/${meal.id}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{meal.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {meal.items.length
                    ? `${meal.items.length} item${meal.items.length === 1 ? "" : "s"} · ${meal.time}`
                    : "Nothing logged yet"}
                </p>
              </div>
              <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {meal.totals.calories} <span className="text-sm font-normal text-zinc-400">kcal</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
