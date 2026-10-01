import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { hashPassword } from "../../../../db/password";
import { users } from "../../../../db/schema";
import { createSession } from "../../../_lib/auth";
import { computeGoals } from "../../../_lib/nutrition";
import { activityLevelOptions, genderOptions } from "../../../_lib/profile-options";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  age?: number;
  gender?: string;
  weightLbs?: number;
  heightFeet?: number;
  heightInches?: number;
  activityLevel?: string;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupBody;

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const gender = genderOptions.find((o) => o.id === body.gender)?.id;
  const activityLevel = activityLevelOptions.find((o) => o.id === body.activityLevel)?.id;
  const { age, weightLbs, heightFeet, heightInches } = body;

  if (!name) return fail("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  if (!gender) return fail("Select a gender.");
  if (!activityLevel) return fail("Select an activity level.");
  if (!Number.isInteger(age) || age! < 13 || age! > 120) return fail("Enter an age between 13 and 120.");
  if (typeof weightLbs !== "number" || !(weightLbs >= 50 && weightLbs <= 700)) {
    return fail("Enter a weight between 50 and 700 lbs.");
  }
  if (!Number.isInteger(heightFeet) || heightFeet! < 3 || heightFeet! > 8) {
    return fail("Enter a height between 3 and 8 feet.");
  }
  if (!Number.isInteger(heightInches) || heightInches! < 0 || heightInches! > 11) {
    return fail("Inches must be between 0 and 11.");
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return fail("An account with that email already exists.", 409);

  const health = {
    age: age!,
    gender,
    weightLbs,
    heightFeet: heightFeet!,
    heightInches: heightInches!,
    activityLevel,
  };

  let user;
  try {
    [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password), ...health, ...computeGoals(health) })
      .returning({ id: users.id });
  } catch {
    // Unique-constraint race with a concurrent signup for the same email.
    return fail("An account with that email already exists.", 409);
  }

  await createSession(user.id);
  return NextResponse.json({ success: true }, { status: 201 });
}
