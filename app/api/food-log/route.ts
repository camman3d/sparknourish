import { NextResponse } from "next/server";
import { addFoodLogEntry } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";
import { dateKey, parseDateKey, todayUtc } from "../../_lib/calendar";
import type { MealId } from "../../_lib/mock-data";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json()) as {
    mealType?: MealId;
    name?: string;
    quantity?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    date?: string;
  };

  if (!body.mealType || !body.name || !body.quantity) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Optional date (YYYY-MM-DD) lets the Diary log into a selected day. Past /
  // future days are stamped at noon UTC; today keeps the real time.
  const parsedDate = parseDateKey(body.date);
  let loggedAt: Date | undefined;
  if (parsedDate && dateKey(parsedDate) !== dateKey(todayUtc())) {
    loggedAt = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 12)
    );
  }

  const entry = await addFoodLogEntry({
    userId: user.id,
    mealType: body.mealType,
    name: body.name,
    quantity: body.quantity,
    calories: body.calories ?? 0,
    proteinG: body.protein ?? 0,
    carbsG: body.carbs ?? 0,
    fatG: body.fat ?? 0,
    loggedAt,
  });

  return NextResponse.json(entry, { status: 201 });
}
