import { getHistory } from "../../db/queries";
import { dayStreak } from "../_lib/mock-data";
import { requireUser } from "../_lib/auth";
import { resolveTimeZone } from "../_lib/calendar";
import { ProfileForm } from "./ProfileForm";

// Reads the session user and recent history (for the streak) — per-request.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const days = await getHistory(user.id, 30, resolveTimeZone(user.timezone));
  const streak = dayStreak(days);

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <h1 className="font-display text-4xl font-bold text-forest-900">Profile</h1>

      <ProfileForm
        streak={streak}
        initial={{
          name: user.name,
          age: user.age,
          gender: user.gender,
          weightLbs: user.weightLbs,
          heightFeet: user.heightFeet,
          heightInches: user.heightInches,
          activityLevel: user.activityLevel,
          dailyCalorieGoal: user.dailyCalorieGoal,
          proteinGoalG: user.proteinGoalG,
          carbsGoalG: user.carbsGoalG,
          fatGoalG: user.fatGoalG,
          waterGoalOz: user.waterGoalOz,
          fitnessGoal: user.fitnessGoal,
          weeklyMoveGoalMin: user.weeklyMoveGoalMin,
          addExerciseToBudget: user.addExerciseToBudget,
          remindersEnabled: user.remindersEnabled,
          units: user.units,
          timezone: resolveTimeZone(user.timezone),
          openRouterApiKey: user.openRouterApiKey,
        }}
      />
    </main>
  );
}
