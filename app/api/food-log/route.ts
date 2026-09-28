import { NextResponse } from "next/server";
import { addFoodLogEntry, getCurrentUser } from "../../../db/queries";
import type { MealId } from "../../_lib/mock-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mealType?: MealId;
    name?: string;
    quantity?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  if (!body.mealType || !body.name || !body.quantity) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const entry = await addFoodLogEntry({
    userId: user.id,
    mealType: body.mealType,
    name: body.name,
    quantity: body.quantity,
    calories: body.calories ?? 0,
    proteinG: body.protein ?? 0,
    carbsG: body.carbs ?? 0,
    fatG: body.fat ?? 0,
  });

  return NextResponse.json(entry, { status: 201 });
}
