import { NextResponse } from "next/server";
import { deleteSession } from "../../../_lib/auth";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
