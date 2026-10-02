import Link from "next/link";
import { Play, Plus } from "lucide-react";
import { MovementIcon, movementTint } from "../_components/MovementIcon";
import { ProgressRing } from "../_components/ProgressRing";
import { getMovementOverview } from "../../db/queries";
import { requireUser } from "../_lib/auth";
import { relativeDayLabel, resolveTimeZone, shortDateLabel, todayMarker } from "../_lib/calendar";
import {
  dailyMoveGoal,
  movementOption,
  movementTip,
  type MovementType,
} from "../_lib/movement";

// Reads live movement data and the user's goals — must render per-request.
export const dynamic = "force-dynamic";

export default async function MovePage() {
  const user = await requireUser();
  const timeZone = resolveTimeZone(user.timezone);
  const overview = await getMovementOverview(user.id, timeZone, new Date());

  const today = todayMarker(timeZone);
  const weeklyGoal = user.weeklyMoveGoalMin;
  const dayGoal = dailyMoveGoal(weeklyGoal);

  const todayMinutes = overview.today.minutes;
  const todayRemaining = dayGoal > 0 ? Math.max(0, dayGoal - todayMinutes) : 0;
  const todayPct = dayGoal > 0 ? (todayMinutes / dayGoal) * 100 : todayMinutes > 0 ? 100 : 0;

  const weekMinutes = overview.week.totalMinutes;
  const weekRemaining = weeklyGoal > 0 ? Math.max(0, weeklyGoal - weekMinutes) : 0;
  const weekPct = weeklyGoal > 0 ? Math.min(100, (weekMinutes / weeklyGoal) * 100) : 0;

  const maxDay = Math.max(30, ...overview.week.days.map((day) => day.minutes));
  const latestToday = overview.today.entries[0];
  const tip =
    weeklyGoal > 0
      ? movementTip(weekRemaining)
      : {
          title: "No weekly goal set",
          body: "Pick a target in Profile so you can track progress against it.",
        };

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-forest-900">Move</h1>
        <p className="pb-1 text-sm text-sand-500">{shortDateLabel(today)}</p>
      </header>

      {/* Today */}
      <section className="card flex items-center gap-5 p-5">
        <ProgressRing
          pct={todayPct}
          size={112}
          stroke={12}
          trackColor="var(--color-plum-100)"
          progressColor="var(--color-plum-600)"
        >
          <span className="font-display text-3xl font-bold leading-none text-forest-900">
            {todayMinutes}
          </span>
          <span className="mt-1 text-xs text-sand-500">
            {dayGoal > 0 ? `of ${dayGoal} min` : "min today"}
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-sand-500">Today</p>
          {dayGoal > 0 ? (
            <p className="mt-0.5 font-display text-2xl font-bold leading-tight text-forest-900">
              {todayRemaining > 0 ? `${todayRemaining} minutes to go` : "Goal reached"}
            </p>
          ) : (
            <p className="mt-0.5 font-display text-2xl font-bold leading-tight text-forest-900">
              {todayMinutes > 0 ? `${todayMinutes} min moved` : "Ready when you are"}
            </p>
          )}
          <p className="mt-1 text-sm text-sand-500">
            {latestToday
              ? `${movementOption(latestToday.activity).name} · about ${latestToday.calories} kcal`
              : weeklyGoal > 0
                ? "A short walk is a great start."
                : "No weekly goal — just tracking movement."}
          </p>
        </div>
      </section>

      {/* This week */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-forest-900">This week</h2>
          <p className="text-sm font-semibold tabular-nums text-forest-900">
            {weekMinutes}
            <span className="font-medium text-sand-500">
              {weeklyGoal > 0 ? ` / ${weeklyGoal} min` : " min"}
            </span>
          </p>
        </div>

        {weeklyGoal > 0 && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-plum-100">
            <div
              className="h-full rounded-full bg-plum-600"
              style={{ width: `${Math.max(weekPct, weekMinutes > 0 ? 4 : 0)}%` }}
            />
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-2">
          {overview.week.days.map((day) => {
            const barHeight = day.minutes > 0 ? 20 + (day.minutes / maxDay) * 64 : 8;
            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end justify-center">
                  <div
                    style={{ height: `${barHeight}px` }}
                    className={`w-6 rounded-lg transition-colors ${
                      day.minutes > 0
                        ? "bg-plum-600"
                        : day.isToday
                          ? "bg-plum-100 ring-2 ring-plum-600"
                          : day.isFuture
                            ? "bg-plum-100/70"
                            : "bg-plum-100"
                    } ${day.isToday && day.minutes > 0 ? "ring-2 ring-plum-600" : ""}`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    day.isToday ? "text-plum-700" : "text-sand-500"
                  }`}
                >
                  {day.weekday.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/move/timer?activity=walk"
          className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-plum-600 px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-plum-700"
        >
          <Play className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          Start a walk
        </Link>
        <Link
          href="/move/log"
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-plum-200 bg-white px-4 py-4 text-base font-semibold text-plum-700 transition-colors hover:bg-plum-50"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          Log one
        </Link>
      </div>

      {/* Tip */}
      <section className="flex items-center gap-4 rounded-card bg-plum-50 p-5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-forest-900">{tip.title}</p>
          <p className="mt-0.5 text-sm text-sand-600">{tip.body}</p>
        </div>
        <Link
          href={weeklyGoal > 0 ? "/move/timer?activity=walk&target=10" : "/profile"}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-plum-200 bg-white text-sm font-semibold text-plum-700 transition-colors hover:bg-plum-100"
        >
          Go
        </Link>
      </section>

      {/* Recent */}
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-forest-900">Recent</h2>
        {overview.recent.length === 0 ? (
          <p className="mt-2 text-sm text-sand-500">
            Nothing logged yet. Start a walk or log an activity to see it here.
          </p>
        ) : (
          <div className="mt-1 divide-y divide-sand-100">
            {overview.recent.map((entry) => (
              <Link
                key={entry.id}
                href={`/move/log?edit=${entry.id}`}
                className="flex items-center gap-3 py-3 transition-colors hover:opacity-80"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${movementTint}`}
                >
                  <MovementIcon activity={entry.activity as MovementType} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-forest-900">
                    {movementOption(entry.activity as MovementType).name}
                  </p>
                  <p className="text-sm text-sand-500">
                    {relativeDayLabel(entry.loggedAt, timeZone)} · {entry.durationMin} min
                  </p>
                </div>
                <p className="shrink-0 font-display text-lg font-bold tabular-nums text-forest-900">
                  {entry.calories}
                  <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
