import { NextResponse } from "next/server";
import { getCurrentUser, toPublicUser, updateUser } from "../../../db/queries";
import type { NewUser } from "../../../db/schema";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(toPublicUser(user));
}

export async function PATCH(request: Request) {
  const patch = (await request.json()) as Partial<NewUser>;
  const user = await getCurrentUser();
  const updated = await updateUser(user.id, patch);
  return NextResponse.json(toPublicUser(updated));
}
