import { NextResponse } from "next/server";
import { searchFoods } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : 30;

  const results = await searchFoods(user.id, q, limit);
  return NextResponse.json(results);
}
