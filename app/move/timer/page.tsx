import { getMovementForDate } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";
import { resolveTimeZone, todayMarker } from "../../_lib/calendar";
import {
  dailyMoveGoal,
  isMovementType,
  type MovementType,
} from "../../_lib/movement";
import { MovementTimer } from "./MovementTimer";

// Reads live movement data and the user's goals — must render per-request.
export const dynamic = "force-dynamic";

export default async function MovementTimerPage(props: PageProps<"/move/timer">) {
  const params = await props.searchParams;
  const user = await requireUser();

  const requestedActivity = Array.isArray(params.activity) ? params.activity[0] : params.activity;
  const activity: MovementType = isMovementType(requestedActivity) ? requestedActivity : "walk";

  const requestedTarget = Array.isArray(params.target) ? params.target[0] : params.target;
  const parsedTarget = Number(requestedTarget);

  const timeZone = resolveTimeZone(user.timezone);
  const today = await getMovementForDate(user.id, todayMarker(timeZone), timeZone);
  const dayGoal = dailyMoveGoal(user.weeklyMoveGoalMin);
  const target =
    Number.isFinite(parsedTarget) && parsedTarget >= 1 && parsedTarget <= 600
      ? Math.round(parsedTarget)
      : dayGoal > 0
        ? dayGoal
        : 25;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-plum-50 px-5 pb-8 pt-8">
      <MovementTimer
        activity={activity}
        targetMin={target}
        weightLbs={user.weightLbs}
        doneTodayMin={today.minutes}
        dayGoalMin={dayGoal}
      />
    </main>
  );
}
