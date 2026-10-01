import type { ActivityLevel, Gender } from "./profile-options";

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Mifflin-St Jeor BMR x activity factor, with a 30/40/30 protein/carbs/fat split.
export function computeGoals(input: {
  age: number;
  gender: Gender;
  weightLbs: number;
  heightFeet: number;
  heightInches: number;
  activityLevel: ActivityLevel;
}) {
  const kg = input.weightLbs * 0.45359237;
  const cm = (input.heightFeet * 12 + input.heightInches) * 2.54;
  const genderOffset = input.gender === "male" ? 5 : input.gender === "female" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * input.age + genderOffset;

  const dailyCalorieGoal = Math.max(1200, Math.round((bmr * activityFactors[input.activityLevel]) / 10) * 10);
  return {
    dailyCalorieGoal,
    proteinGoalG: Math.round((dailyCalorieGoal * 0.3) / 4),
    carbsGoalG: Math.round((dailyCalorieGoal * 0.4) / 4),
    fatGoalG: Math.round((dailyCalorieGoal * 0.3) / 9),
  };
}
