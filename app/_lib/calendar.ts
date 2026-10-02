// UTC-based date helpers shared by the Diary (Home) screen and queries. The
// rest of the app already buckets food logs by UTC day, so dates here are
// handled in UTC to stay consistent.

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

/** Parse a `YYYY-MM-DD` search param into a UTC day, or null when invalid. */
export function parseDateKey(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function todayUtc(): Date {
  return startOfDayUtc(new Date());
}

export type WeekDay = {
  key: string;
  weekday: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
};

/** The Monday–Sunday week containing `selected`, labelled for the day strip. */
export function weekDays(selected: Date): WeekDay[] {
  const today = todayUtc();
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
export function relativeDayLabel(date: Date): string {
  const today = todayUtc();
  const key = dateKey(date);
  if (key === dateKey(today)) return "Today";
  if (key === dateKey(addDays(today, -1))) return "Yesterday";
  return shortDateLabel(date);
}

/** Friendly label for the selected day: "Today", "Yesterday", or "Fri, Oct 2". */
export function dayLabel(date: Date): string {
  const today = todayUtc();
  const key = dateKey(date);
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
