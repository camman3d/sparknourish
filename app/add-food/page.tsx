import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FoodSearch } from "./FoodSearch";
import { requireUser } from "../_lib/auth";
import type { MealId } from "../_lib/mock-data";
import { getLastLoggedMealToday } from "../../db/queries";

const VALID_MEALS: MealId[] = ["breakfast", "lunch", "dinner", "snacks"];

export default async function AddFoodPage(props: PageProps<"/add-food">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.meal) ? params.meal[0] : params.meal;
  // An explicit ?meal= wins; otherwise default to the meal most recently logged
  // today, falling back to breakfast.
  let initialMeal: MealId;
  if (VALID_MEALS.includes(requested as MealId)) {
    initialMeal = requested as MealId;
  } else {
    const user = await requireUser();
    initialMeal = (await getLastLoggedMealToday(user.id)) ?? "breakfast";
  }

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Add Food</h1>
      </header>

      <FoodSearch initialMeal={initialMeal} />
    </main>
  );
}
