import { FoodSearch } from "./FoodSearch";
import { requireUser } from "../_lib/auth";
import { mealOptions, type MealId } from "../_lib/mock-data";
import { dateKey, parseDateKey, resolveTimeZone, todayMarker } from "../_lib/calendar";
import { getLastLoggedMealToday, getRecentFoods } from "../../db/queries";

const VALID_MEALS: MealId[] = mealOptions.map((meal) => meal.id);

export default async function AddFoodPage(props: PageProps<"/add-food">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.meal) ? params.meal[0] : params.meal;
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;

  const user = await requireUser();
  const timeZone = resolveTimeZone(user.timezone);
  const date = parseDateKey(requestedDate) ?? todayMarker(timeZone);
  const dateParam = dateKey(date);

  // An explicit ?meal= wins; otherwise default to the meal most recently logged
  // today, falling back to breakfast.
  let initialMeal: MealId;
  if (VALID_MEALS.includes(requested as MealId)) {
    initialMeal = requested as MealId;
  } else {
    initialMeal = (await getLastLoggedMealToday(user.id, timeZone)) ?? "breakfast";
  }

  const recent = await getRecentFoods(user.id);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

  return (
    <main className="flex flex-col gap-5 px-5 pb-28 pt-8">
      <header className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-forest-900">Add food</h1>
        <p className="pb-1 text-sm text-sand-500">{dateLabel}</p>
      </header>

      <FoodSearch initialMeal={initialMeal} date={dateParam} recent={recent} />
    </main>
  );
}
