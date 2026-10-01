import { NextResponse } from "next/server";
import { toPublicUser, updateUser } from "../../../db/queries";
import type { NewUser } from "../../../db/schema";
import { getSessionUser } from "../../_lib/auth";

// Only these fields may be changed through this endpoint (never id, email,
// passwordHash, etc.).
const editableFields = [
  "name",
  "age",
  "gender",
  "weightLbs",
  "heightFeet",
  "heightInches",
  "activityLevel",
  "dailyCalorieGoal",
  "proteinGoalG",
  "carbsGoalG",
  "fatGoalG",
  "openRouterApiKey",
] as const satisfies readonly (keyof NewUser)[];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(toPublicUser(user));
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (field in body) patch[field] = body[field];
  }

  const updated = await updateUser(user.id, patch as Partial<NewUser>);
  return NextResponse.json(toPublicUser(updated));
}
