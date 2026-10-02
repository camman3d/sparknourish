import type { ActivityLevel, FitnessGoal, Gender } from "./profile-options";

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Calorie adjustment applied to maintenance (TDEE) for each goal.
const goalCalorieFactor: Record<FitnessGoal, number> = {
  lose: 0.85,
  maintain: 1,
  build: 1.1,
};

// Protein / carbs / fat share of daily calories for each goal.
const goalMacroSplit: Record<FitnessGoal, { protein: number; carbs: number; fat: number }> = {
  lose: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  build: { protein: 0.35, carbs: 0.4, fat: 0.25 },
};

// Mifflin-St Jeor BMR x activity factor, adjusted for the user's goal, then
// split into protein/carbs/fat targets.
export function computeGoals(input: {
  age: number;
  gender: Gender;
  weightLbs: number;
  heightFeet: number;
  heightInches: number;
  activityLevel: ActivityLevel;
  goal?: FitnessGoal;
}) {
  const goal = input.goal ?? "maintain";
  const kg = input.weightLbs * 0.45359237;
  const cm = (input.heightFeet * 12 + input.heightInches) * 2.54;
  const genderOffset = input.gender === "male" ? 5 : input.gender === "female" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * input.age + genderOffset;

  const tdee = bmr * activityFactors[input.activityLevel];
  const dailyCalorieGoal = Math.max(
    1200,
    Math.round((tdee * goalCalorieFactor[goal]) / 10) * 10
  );
  const split = goalMacroSplit[goal];

  return {
    dailyCalorieGoal,
    proteinGoalG: Math.round((dailyCalorieGoal * split.protein) / 4),
    carbsGoalG: Math.round((dailyCalorieGoal * split.carbs) / 4),
    fatGoalG: Math.round((dailyCalorieGoal * split.fat) / 9),
  };
}
