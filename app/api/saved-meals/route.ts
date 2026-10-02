import { NextResponse } from "next/server";
import { createSavedMeal, getSavedMeals, type SavedMealItemInput } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";

/** Guards against oversized templates. */
const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 80;

type ItemBody = {
  name?: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

function parseItem(raw: ItemBody, index: number): SavedMealItemInput | string {
  const name = raw.name?.trim();
  const quantity = raw.quantity?.trim();
  if (!name) return `Item ${index + 1}: a food name is required.`;
  if (!quantity) return `Item ${index + 1}: a serving / quantity is required.`;

  const calories = Number(raw.calories);
  if (!Number.isFinite(calories) || calories < 0) {
    return `Item ${index + 1}: valid calories are required.`;
  }

  const macro = (value: unknown) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 10) / 10 : 0;
  };

  return {
    name,
    quantity,
    calories: Math.round(calories),
    proteinG: macro(raw.protein),
    carbsG: macro(raw.carbs),
    fatG: macro(raw.fat),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const meals = await getSavedMeals(user.id);
  return NextResponse.json(meals);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    items?: ItemBody[];
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Meal name is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Meal name must be ${MAX_NAME_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) {
    return NextResponse.json({ error: "Add at least one item to save." }, { status: 400 });
  }
  if (rawItems.length > MAX_ITEMS) {
    return NextResponse.json({ error: `A meal can hold at most ${MAX_ITEMS} items.` }, { status: 400 });
  }

  const items: SavedMealItemInput[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const parsed = parseItem(rawItems[i] ?? {}, i);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }
    items.push(parsed);
  }

  const created = await createSavedMeal(user.id, name, items);
  return NextResponse.json(created, { status: 201 });
}
