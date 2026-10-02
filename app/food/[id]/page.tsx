import { notFound } from "next/navigation";
import { getFoodDetail } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";
import { dateKey, parseDateKey, todayUtc } from "../../_lib/calendar";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import { FoodDetailScreen } from "./FoodDetailScreen";

// Reads the session, the requested food and the user's goals — per-request.
export const dynamic = "force-dynamic";

function defaultMealForNow(): MealId {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snacks";
}

export default async function FoodDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ meal?: string | string[]; date?: string | string[] }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const user = await requireUser();
  const food = await getFoodDetail(user.id, id);
  if (!food) notFound();

  const requestedMeal = Array.isArray(searchParams.meal) ? searchParams.meal[0] : searchParams.meal;
  const meal: MealId = mealOptions.some((option) => option.id === requestedMeal)
    ? (requestedMeal as MealId)
    : defaultMealForNow();
  const date = parseDateKey(Array.isArray(searchParams.date) ? searchParams.date[0] : searchParams.date);
  const dateParam = dateKey(date ?? todayUtc());

  return (
    <FoodDetailScreen
      food={food}
      dailyGoal={user.dailyCalorieGoal}
      proteinGoal={user.proteinGoalG}
      carbsGoal={user.carbsGoalG}
      fatGoal={user.fatGoalG}
      meal={meal}
      date={dateParam}
    />
  );
}
