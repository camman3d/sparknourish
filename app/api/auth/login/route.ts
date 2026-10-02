import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { hashPassword, verifyPassword } from "../../../../db/password";
import { users } from "../../../../db/schema";
import { createSession } from "../../../_lib/auth";
import { isValidTimeZone } from "../../../_lib/calendar";
import { updateUser } from "../../../../db/queries";

// Compared against when the email is unknown so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = hashPassword("dummy-password");

export async function POST(request: Request) {
  const { email, password, timezone } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    timezone?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  const valid = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Keep the stored zone current so logs bucket into the right local days.
  if (isValidTimeZone(timezone) && timezone !== user.timezone) {
    await updateUser(user.id, { timezone });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
