import { NextResponse } from "next/server";
import { toPublicUser, updateUser } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";
import { computeGoals } from "../../_lib/nutrition";
import {
  activityLevelOptions,
  fitnessGoalOptions,
  genderOptions,
  type ActivityLevel,
  type FitnessGoal,
  type Gender,
} from "../../_lib/profile-options";
import { DEFAULT_WEEKLY_MOVE_GOAL, isWeeklyMoveGoal } from "../../_lib/movement";

type OnboardingBody = {
  goal?: string;
  gender?: string;
  age?: number;
  weightLbs?: number;
  heightFeet?: number;
  heightInches?: number;
  activityLevel?: string;
  /** Weekly movement target in minutes; 0 means "no movement goal". */
  weeklyMoveGoalMin?: number;
  /** When true, unanswered questions fall back to sensible defaults. */
  skip?: boolean;
};

// Used when the user skips one or more onboarding questions.
const DEFAULTS = {
  goal: "maintain" as FitnessGoal,
  gender: "other" as Gender,
  age: 30,
  weightLbs: 150,
  heightFeet: 5,
  heightInches: 6,
  activityLevel: "light" as ActivityLevel,
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as OnboardingBody;
  const skip = body.skip === true;

  const goal = fitnessGoalOptions.find((o) => o.id === body.goal)?.id ?? DEFAULTS.goal;
  const gender = genderOptions.find((o) => o.id === body.gender)?.id ?? DEFAULTS.gender;
  const activityLevel =
    activityLevelOptions.find((o) => o.id === body.activityLevel)?.id ?? DEFAULTS.activityLevel;

  const age = Number.isInteger(body.age) ? (body.age as number) : DEFAULTS.age;
  const weightLbs = typeof body.weightLbs === "number" ? body.weightLbs : DEFAULTS.weightLbs;
  const heightFeet = Number.isInteger(body.heightFeet) ? (body.heightFeet as number) : DEFAULTS.heightFeet;
  const heightInches = Number.isInteger(body.heightInches)
    ? (body.heightInches as number)
    : DEFAULTS.heightInches;
  const weeklyMoveGoalMin = isWeeklyMoveGoal(body.weeklyMoveGoalMin)
    ? body.weeklyMoveGoalMin
    : DEFAULT_WEEKLY_MOVE_GOAL;

  if (!skip) {
    if (!body.goal) return fail("Pick a goal.");
    if (!body.gender) return fail("Select a gender.");
    if (!Number.isInteger(body.age) || age < 13 || age > 120) return fail("Enter an age between 13 and 120.");
    if (typeof body.weightLbs !== "number" || !(weightLbs >= 50 && weightLbs <= 700)) {
      return fail("Enter a weight between 50 and 700 lbs.");
    }
    if (!Number.isInteger(body.heightFeet) || heightFeet < 3 || heightFeet > 8) {
      return fail("Enter a height between 3 and 8 feet.");
    }
    if (!Number.isInteger(body.heightInches) || heightInches < 0 || heightInches > 11) {
      return fail("Inches must be between 0 and 11.");
    }
    if (!body.activityLevel) return fail("Select an activity level.");
  }

  const health = { age, gender, weightLbs, heightFeet, heightInches, activityLevel };
  const updated = await updateUser(user.id, {
    ...health,
    fitnessGoal: goal,
    weeklyMoveGoalMin,
    ...computeGoals({ ...health, goal }),
    onboardingCompleted: true,
  });

  return NextResponse.json(toPublicUser(updated));
}
