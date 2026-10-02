import { NextResponse } from "next/server";
import { deleteSavedMeal } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const mealId = parseInt((await props.params).id, 10);
  if (!Number.isInteger(mealId) || mealId < 1) {
    return NextResponse.json({ error: "Invalid meal ID." }, { status: 400 });
  }

  const deleted = await deleteSavedMeal(user.id, mealId);
  if (!deleted) {
    return NextResponse.json({ error: "Saved meal not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted });
}
