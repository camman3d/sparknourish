import Link from "next/link";
import { FoodSearch } from "./FoodSearch";
import type { MealId } from "../_lib/mock-data";

const VALID_MEALS: MealId[] = ["breakfast", "lunch", "dinner", "snacks"];

export default async function AddFoodPage(props: PageProps<"/add-food">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.meal) ? params.meal[0] : params.meal;
  const initialMeal: MealId = VALID_MEALS.includes(requested as MealId)
    ? (requested as MealId)
    : "breakfast";

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Add Food</h1>
      </header>

      <FoodSearch initialMeal={initialMeal} />
    </main>
  );
}
