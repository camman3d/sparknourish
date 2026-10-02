import { NextResponse } from "next/server";
import { deleteFoodLogEntry, updateFoodLogEntry } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";
import type { MealId } from "../../../_lib/mock-data";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await props.params;
  const entryId = parseInt(id, 10);
  if (!entryId || isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });
  }

  const deleted = await deleteFoodLogEntry(user.id, entryId);
  if (!deleted) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await props.params;
  const entryId = parseInt(id, 10);
  if (!entryId || isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    quantity?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealType?: MealId;
  };

  const patch: Parameters<typeof updateFoodLogEntry>[2] = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.quantity !== undefined) patch.quantity = body.quantity.trim();
  if (body.calories !== undefined) patch.calories = Math.round(body.calories);
  if (body.protein !== undefined) patch.proteinG = Math.round(body.protein * 10) / 10;
  if (body.carbs !== undefined) patch.carbsG = Math.round(body.carbs * 10) / 10;
  if (body.fat !== undefined) patch.fatG = Math.round(body.fat * 10) / 10;
  if (body.mealType !== undefined) patch.mealType = body.mealType;

  const updated = await updateFoodLogEntry(user.id, entryId, patch);
  if (!updated) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
