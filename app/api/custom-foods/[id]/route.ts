import { NextResponse } from "next/server";
import { deleteCustomFood } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await props.params;
  const foodId = parseInt(id, 10);
  if (!foodId || isNaN(foodId)) {
    return NextResponse.json({ error: "Invalid food ID." }, { status: 400 });
  }

  const deleted = await deleteCustomFood(user.id, foodId);
  if (!deleted) {
    return NextResponse.json({ error: "Food not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted });
}
