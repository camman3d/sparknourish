import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { hashPassword } from "../../../../db/password";
import { users } from "../../../../db/schema";
import { createSession } from "../../../_lib/auth";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// Creates the account only. Health details, the fitness goal and the resulting
// calorie/macro targets are collected by the guided onboarding that follows.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupBody;

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!name) return fail("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return fail("An account with that email already exists.", 409);

  let user;
  try {
    [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: hashPassword(password),
        onboardingCompleted: false,
      })
      .returning({ id: users.id });
  } catch {
    // Unique-constraint race with a concurrent signup for the same email.
    return fail("An account with that email already exists.", 409);
  }

  await createSession(user.id);
  return NextResponse.json({ success: true }, { status: 201 });
}
