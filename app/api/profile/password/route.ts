import { NextResponse } from "next/server";
import { updateUser } from "../../../../db/queries";
import { hashPassword, verifyPassword } from "../../../../db/password";
import { getSessionUser } from "../../../_lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { currentPassword, newPassword } = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  await updateUser(user.id, { passwordHash: hashPassword(newPassword) });
  return NextResponse.json({ success: true });
}
