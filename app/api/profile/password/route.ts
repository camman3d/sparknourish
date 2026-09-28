import { NextResponse } from "next/server";
import { getCurrentUser, updateUser } from "../../../../db/queries";
import { hashPassword, verifyPassword } from "../../../../db/password";

export async function POST(request: Request) {
  const { currentPassword, newPassword } = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const user = await getCurrentUser();
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
