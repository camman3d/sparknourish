import { NextResponse } from "next/server";
import { addWaterEntry, deleteLatestWaterEntry } from "../../../db/queries";
import { getSessionUser } from "../../_lib/auth";
import {
  dateKey,
  markerAtLocalHour,
  parseDateKey,
  resolveTimeZone,
  todayKey,
  todayMarker,
} from "../../_lib/calendar";

/** Max per single log — guards against fat-fingered input. */
const MAX_GLASS_OZ = 128;

// Optional date (YYYY-MM-DD) attaches the entry to a selected day. Past / future
// days are stamped at local noon; today keeps the real time. Matches food/movement.
function resolveLoggedAt(date: string | null | undefined, timeZone: string): Date | undefined {
  const parsedDate = parseDateKey(date);
  if (parsedDate && dateKey(parsedDate) !== todayKey(timeZone)) {
    return markerAtLocalHour(parsedDate, 12, timeZone);
  }
  return undefined;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    amountOz?: number;
    date?: string;
  };

  const amountOz = Math.round(Number(body.amountOz));
  if (!Number.isFinite(amountOz) || amountOz < 1 || amountOz > MAX_GLASS_OZ) {
    return NextResponse.json(
      { error: `Amount must be between 1 and ${MAX_GLASS_OZ} oz.` },
      { status: 400 }
    );
  }

  const entry = await addWaterEntry({
    userId: user.id,
    amountOz,
    loggedAt: resolveLoggedAt(body.date, resolveTimeZone(user.timezone)),
  });

  return NextResponse.json(entry, { status: 201 });
}

// Removes the most recently logged entry for the day (the tile's undo).
export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const timeZone = resolveTimeZone(user.timezone);
  const date = new URL(request.url).searchParams.get("date");
  const target = parseDateKey(date) ?? todayMarker(timeZone);

  const deleted = await deleteLatestWaterEntry(user.id, target, timeZone);
  if (!deleted) {
    return NextResponse.json({ error: "Nothing to remove." }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
