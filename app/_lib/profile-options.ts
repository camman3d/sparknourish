// Mirrors the gender/activity_level/fitness_goal enums in db/schema.ts. Kept as
// plain literals (not imported from db/schema) so client components don't pull
// drizzle-orm into the browser bundle.

export type Gender = "female" | "male" | "other";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export type FitnessGoal = "lose" | "maintain" | "build";

export const genderOptions: { id: Gender; name: string }[] = [
  { id: "female", name: "Female" },
  { id: "male", name: "Male" },
  { id: "other", name: "Other" },
];

export const activityLevelOptions: { id: ActivityLevel; name: string }[] = [
  { id: "sedentary", name: "Sedentary" },
  { id: "light", name: "Lightly active" },
  { id: "moderate", name: "Moderately active" },
  { id: "active", name: "Active" },
  { id: "very_active", name: "Very active" },
];

export const fitnessGoalOptions: { id: FitnessGoal; name: string; description: string }[] = [
  { id: "lose", name: "Lose weight", description: "A gentle, steady calorie deficit" },
  { id: "maintain", name: "Maintain", description: "Hold steady and eat well" },
  { id: "build", name: "Build muscle", description: "More protein, a small surplus" },
];

/** Short label used in the profile header, e.g. "Goal: lose weight · 12-day streak". */
export function fitnessGoalLabel(goal: FitnessGoal): string {
  return fitnessGoalOptions.find((option) => option.id === goal)?.name.toLowerCase() ?? "maintain";
}
