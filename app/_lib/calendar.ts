// Calendar-day helpers. A "day marker" is a UTC-midnight Date used purely as a
// calendar date (so `?date=YYYY-MM-DD` round-trips through dateKey/parseDateKey).
// The real UTC instants that bound a local day, and per-instant bucketing, are
// computed in the user's IANA time zone so logs land on the correct local day.

export const DEFAULT_TIME_ZONE = "UTC";

export function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` search param into a UTC day marker, or null when invalid. */
export function parseDateKey(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function todayUtc(): Date {
  return startOfDayUtc(new Date());
}

// --- Time zone helpers -------------------------------------------------------

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** A safe IANA zone: the given value when valid, otherwise UTC. */
export function resolveTimeZone(value: string | null | undefined): string {
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = wallClockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    wallClockFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The wall-clock date/time `date` shows in `timeZone`. */
function wallClock(date: Date, timeZone: string): WallClock {
  const values: Record<string, number> = {};
  for (const part of wallClockFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour % 24,
    minute: values.minute,
    second: values.second,
  };
}

/** Milliseconds `timeZone` is ahead of UTC at `date`. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const wall = wallClock(date, timeZone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/**
 * The UTC instant for a wall-clock time in `timeZone`. Resolved iteratively so
 * the result is stable across daylight-saving transitions.
 */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const base = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = base;
  for (let i = 0; i < 2; i += 1) {
    utc = base - timeZoneOffsetMs(new Date(utc), timeZone);
  }
  return new Date(utc);
}

/** `YYYY-MM-DD` for the calendar day `date` falls on in `timeZone`. */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const wall = wallClock(date, timeZone);
  return `${wall.year}-${pad2(wall.month)}-${pad2(wall.day)}`;
}

/** UTC instants bounding the calendar day `date` falls on in `timeZone`. */
export function dayBoundsInTimeZone(date: Date, timeZone: string): { start: Date; end: Date } {
  const wall = wallClock(date, timeZone);
  return {
    start: zonedTimeToUtc(wall.year, wall.month, wall.day, 0, 0, 0, timeZone),
    end: zonedTimeToUtc(wall.year, wall.month, wall.day + 1, 0, 0, 0, timeZone),
  };
}

/**
 * UTC instants bounding the calendar day named by a UTC-midnight day marker, in
 * `timeZone`. Markers come from `parseDateKey` / `todayMarker`.
 */
export function dayBoundsForMarker(marker: Date, timeZone: string): { start: Date; end: Date } {
  const year = marker.getUTCFullYear();
  const month = marker.getUTCMonth() + 1;
  const day = marker.getUTCDate();
  return {
    start: zonedTimeToUtc(year, month, day, 0, 0, 0, timeZone),
    end: zonedTimeToUtc(year, month, day + 1, 0, 0, 0, timeZone),
  };
}

/** The `YYYY-MM-DD` of "now" in `timeZone`. */
export function todayKey(timeZone: string): string {
  return dateKeyInTimeZone(new Date(), timeZone);
}

/** The hour (0–23) that `date` falls on in `timeZone`. */
export function hourInTimeZone(date: Date, timeZone: string): number {
  return wallClock(date, timeZone).hour;
}

/** The UTC-midnight day marker for "now" in `timeZone`. */
export function todayMarker(timeZone: string): Date {
  return parseDateKey(todayKey(timeZone)) ?? startOfDayUtc(new Date());
}

/** A day marker stamped at a wall-clock hour in `timeZone` (used for back-dating). */
export function markerAtLocalHour(marker: Date, hour: number, timeZone: string): Date {
  return zonedTimeToUtc(
    marker.getUTCFullYear(),
    marker.getUTCMonth() + 1,
    marker.getUTCDate(),
    hour,
    0,
    0,
    timeZone
  );
}

// --- Labels (day markers) ----------------------------------------------------

export type WeekDay = {
  key: string;
  weekday: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
};

/** The Monday–Sunday week containing `selected`, labelled for the day strip. */
export function weekDays(selected: Date, timeZone: string = DEFAULT_TIME_ZONE): WeekDay[] {
  const today = todayMarker(timeZone);
  const dow = selected.getUTCDay(); // 0 = Sunday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(selected, mondayOffset);

  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(monday, index);
    const key = dateKey(day);
    return {
      key,
      weekday: weekdayFmt.format(day),
      dayNumber: dayFmt.format(day),
      isSelected: key === dateKey(selected),
      isToday: key === dateKey(today),
    };
  });
}

export function monthYearLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** Compact calendar label, e.g. "Fri, Oct 2" (never "Today"). */
export function shortDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Relative day label: "Today", "Yesterday", or "Wed, Sep 30". */
export function relativeDayLabel(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const key = dateKeyInTimeZone(date, timeZone);
  const today = todayKey(timeZone);
  if (key === today) return "Today";
  const yesterday = dateKey(addDays(parseDateKey(today) ?? todayMarker(timeZone), -1));
  if (key === yesterday) return "Yesterday";
  return shortDateLabel(parseDateKey(key) ?? date);
}

/** Friendly label for the selected day: "Today", "Yesterday", or "Fri, Oct 2". */
export function dayLabel(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const key = dateKey(date);
  const today = todayMarker(timeZone);
  if (key === dateKey(today)) return "Today";
  if (key === dateKey(addDays(today, -1))) return "Yesterday";
  if (key === dateKey(addDays(today, 1))) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
