import { NextResponse } from "next/server";
import {
  deleteMovementEntry,
  getMovementEntry,
  updateMovementEntry,
} from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";
import {
  estimateCalories,
  isMovementIntensity,
  isMovementType,
  type MovementIntensity,
  type MovementType,
} from "../../../_lib/movement";

function parseId(id: string) {
  const entryId = parseInt(id, 10);
  return Number.isInteger(entryId) && entryId > 0 ? entryId : null;
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const entryId = parseId((await props.params).id);
  if (!entryId) return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });

  const deleted = await deleteMovementEntry(user.id, entryId);
  if (!deleted) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  return NextResponse.json({ success: true, deleted });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const entryId = parseId((await props.params).id);
  if (!entryId) return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });

  const existing = await getMovementEntry(user.id, entryId);
  if (!existing) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    activity?: string;
    durationMin?: number;
    intensity?: string;
  };

  const activity: MovementType = isMovementType(body.activity) ? body.activity : existing.activity;
  const intensity: MovementIntensity = isMovementIntensity(body.intensity)
    ? body.intensity
    : existing.intensity;

  let durationMin = existing.durationMin;
  if (body.durationMin !== undefined) {
    const next = Math.round(Number(body.durationMin));
    if (!Number.isFinite(next) || next < 1 || next > 600) {
      return NextResponse.json({ error: "Duration must be between 1 and 600 minutes." }, { status: 400 });
    }
    durationMin = next;
  }

  const updated = await updateMovementEntry(user.id, entryId, {
    activity,
    intensity,
    durationMin,
    calories: estimateCalories({
      activity,
      durationMin,
      intensity,
      weightLbs: user.weightLbs,
    }),
  });

  return NextResponse.json(updated);
}
