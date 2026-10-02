import { NextResponse } from "next/server";
import { addMovementEntry } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";
import { dateKey, parseDateKey, todayUtc } from "../../_lib/calendar";
import {
  estimateCalories,
  isMovementIntensity,
  isMovementType,
  type MovementIntensity,
} from "../../_lib/movement";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    activity?: string;
    durationMin?: number;
    intensity?: string;
    date?: string;
  };

  if (!isMovementType(body.activity)) {
    return NextResponse.json({ error: "Choose an activity." }, { status: 400 });
  }

  const durationMin = Math.round(Number(body.durationMin));
  if (!Number.isFinite(durationMin) || durationMin < 1 || durationMin > 600) {
    return NextResponse.json({ error: "Duration must be between 1 and 600 minutes." }, { status: 400 });
  }

  const intensity: MovementIntensity = isMovementIntensity(body.intensity)
    ? body.intensity
    : "moderate";

  // Optional date (YYYY-MM-DD) lets movement be attached to a selected day.
  const parsedDate = parseDateKey(body.date);
  let loggedAt: Date | undefined;
  if (parsedDate && dateKey(parsedDate) !== dateKey(todayUtc())) {
    loggedAt = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 12)
    );
  }

  const entry = await addMovementEntry({
    userId: user.id,
    activity: body.activity,
    durationMin,
    intensity,
    calories: estimateCalories({
      activity: body.activity,
      durationMin,
      intensity,
      weightLbs: user.weightLbs,
    }),
    loggedAt,
  });

  return NextResponse.json(entry, { status: 201 });
}
