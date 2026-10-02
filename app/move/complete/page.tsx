import { redirect } from "next/navigation";
import { getMealsForDate, getMovementEntry, getMovementOverview } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";
import { resolveTimeZone, todayMarker } from "../../_lib/calendar";
import { CompletionScreen } from "./CompletionScreen";

// Shows the just-logged activity and live week/budget figures — per-request.
export const dynamic = "force-dynamic";

export default async function MovementCompletePage(props: PageProps<"/move/complete">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.entry) ? params.entry[0] : params.entry;

  const user = await requireUser();
  const timeZone = resolveTimeZone(user.timezone);

  const entryId = parseInt(requested ?? "", 10);
  const entry = Number.isInteger(entryId) ? await getMovementEntry(user.id, entryId) : null;
  if (!entry) redirect("/move");

  const [overview, { totals }] = await Promise.all([
    getMovementOverview(user.id, timeZone, new Date()),
    getMealsForDate(user.id, todayMarker(timeZone), timeZone),
  ]);

  const remainingBase = user.dailyCalorieGoal - totals.calories;
  const remainingWith = remainingBase + overview.today.calories;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-sand-100">
      <CompletionScreen
        firstName={user.name.split(" ")[0]}
        entry={{
          id: entry.id,
          activity: entry.activity,
          durationMin: entry.durationMin,
          calories: entry.calories,
        }}
        week={{
          totalMinutes: overview.week.totalMinutes,
          goalMinutes: user.weeklyMoveGoalMin,
          movedDays: overview.week.movedDays,
        }}
        remainingBase={remainingBase}
        remainingWith={remainingWith}
        addToBudget={user.addExerciseToBudget}
      />
    </main>
  );
}
