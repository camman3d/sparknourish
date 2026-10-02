import { NextResponse } from "next/server";
import { createCustomFood, getCustomFoods } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const foods = await getCustomFoods(user.id);
  return NextResponse.json(foods);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    servingSize?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  const name = body.name?.trim();
  const servingSize = body.servingSize?.trim();
  const calories = Number(body.calories);

  if (!name) {
    return NextResponse.json({ error: "Food name is required." }, { status: 400 });
  }
  if (!servingSize) {
    return NextResponse.json({ error: "Serving size is required." }, { status: 400 });
  }
  if (isNaN(calories) || calories < 0) {
    return NextResponse.json({ error: "Valid calories are required." }, { status: 400 });
  }

  const created = await createCustomFood(user.id, {
    name,
    servingSize,
    calories: Math.round(calories),
    proteinG: Math.max(0, Math.round(Number(body.protein || 0) * 10) / 10),
    carbsG: Math.max(0, Math.round(Number(body.carbs || 0) * 10) / 10),
    fatG: Math.max(0, Math.round(Number(body.fat || 0) * 10) / 10),
  });

  return NextResponse.json(created, { status: 201 });
}
