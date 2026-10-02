import { NextResponse } from "next/server";
import { updateUser } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";
import { isValidTimeZone, resolveTimeZone } from "../../../_lib/calendar";

// Keeps the stored IANA time zone in sync with the device. Called on load by
// `TimeZoneSync`; a no-op (no write) when the zone is unchanged.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { timezone?: string };
  if (!isValidTimeZone(body.timezone)) {
    return NextResponse.json({ updated: false, timeZone: resolveTimeZone(user.timezone) });
  }

  if (body.timezone === user.timezone) {
    return NextResponse.json({ updated: false, timeZone: body.timezone });
  }

  await updateUser(user.id, { timezone: body.timezone });
  return NextResponse.json({ updated: true, timeZone: body.timezone });
}
