export type MealId = "breakfast" | "lunch" | "dinner" | "snacks";

export type FoodEntry = {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const mealOptions: { id: MealId; name: string }[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "snacks", name: "Snack" },
  { id: "dinner", name: "Dinner" },
];

// Reference food database for search/autocomplete in Add Food. Not part of the
// Postgres schema — user-logged entries (food_log_entries) reference this data
// by value, not by id.
export const foodDatabase: FoodEntry[] = [
  {
    id: "f1",
    name: "Banana",
    quantity: "1 medium",
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
  },
  {
    id: "f2",
    name: "Grilled chicken breast",
    quantity: "6 oz",
    calories: 280,
    protein: 52,
    carbs: 0,
    fat: 6,
  },
  {
    id: "f3",
    name: "Brown rice",
    quantity: "1 cup",
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
  },
  {
    id: "f4",
    name: "Greek yogurt",
    quantity: "1 cup",
    calories: 150,
    protein: 20,
    carbs: 9,
    fat: 4,
  },
  {
    id: "f5",
    name: "Almonds",
    quantity: "1 oz",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
  },
  {
    id: "f6",
    name: "Whole wheat toast",
    quantity: "1 slice",
    calories: 80,
    protein: 4,
    carbs: 14,
    fat: 1,
  },
  {
    id: "f7",
    name: "Avocado",
    quantity: "1/2 medium",
    calories: 120,
    protein: 1,
    carbs: 6,
    fat: 11,
  },
  {
    id: "f8",
    name: "Salmon fillet",
    quantity: "5 oz",
    calories: 290,
    protein: 34,
    carbs: 0,
    fat: 16,
  },
  {
    id: "f9",
    name: "Eggs",
    quantity: "2 large",
    calories: 140,
    protein: 12,
    carbs: 1,
    fat: 10,
  },
  {
    id: "f10",
    name: "Protein shake",
    quantity: "1 scoop",
    calories: 130,
    protein: 25,
    carbs: 4,
    fat: 2,
  },
];

// --- History aggregation -----------------------------------------------------
// Pure helpers over day-level rollups. The rollups themselves come from
// db/queries.ts (backed by food_log_entries); these functions don't know
// where the data came from.

export type DayLog = {
  date: string;
  label: string;
  weekday: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: Record<MealId, number>;
};

export type HistoryRange = 7 | 30 | 90;

export function historyAverages(days: DayLog[]) {
  const n = days.length || 1;
  const sum = days.reduce(
    (totals, day) => ({
      calories: totals.calories + day.calories,
      protein: totals.protein + day.protein,
      carbs: totals.carbs + day.carbs,
      fat: totals.fat + day.fat,
      water: totals.water + day.water,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
  );
  return {
    calories: Math.round(sum.calories / n),
    protein: Math.round(sum.protein / n),
    carbs: Math.round(sum.carbs / n),
    fat: Math.round(sum.fat / n),
    water: Math.round(sum.water / n),
  };
}

export function mealAverageBreakdown(days: DayLog[]) {
  const n = days.length || 1;
  const totals: Record<MealId, number> = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
  for (const day of days) {
    totals.breakfast += day.meals.breakfast;
    totals.lunch += day.meals.lunch;
    totals.dinner += day.meals.dinner;
    totals.snacks += day.meals.snacks;
  }
  return {
    breakfast: Math.round(totals.breakfast / n),
    lunch: Math.round(totals.lunch / n),
    dinner: Math.round(totals.dinner / n),
    snacks: Math.round(totals.snacks / n),
  };
}

export function daysOnTarget(days: DayLog[], goal: number, tolerance = 0.1) {
  return days.filter((day) => Math.abs(day.calories - goal) <= goal * tolerance).length;
}

export function peakDay(days: DayLog[]) {
  return days.reduce((max, day) => (day.calories > max.calories ? day : max), days[0]);
}

/**
 * Consecutive logged days ending with the most recent day that has data.
 * A leading empty day (e.g. today before the first log) does not break the
 * streak.
 */
export function dayStreak(days: DayLog[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].calories > 0) {
      streak += 1;
    } else if (streak === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** Share of calories from each macro (protein/carbs 4 kcal/g, fat 9 kcal/g). */
export function macroSplitCalories(macros: { protein: number; carbs: number; fat: number }) {
  const protein = macros.protein * 4;
  const carbs = macros.carbs * 4;
  const fat = macros.fat * 9;
  const total = protein + carbs + fat || 1;
  return {
    protein: Math.round((protein / total) * 100),
    carbs: Math.round((carbs / total) * 100),
    fat: Math.round((fat / total) * 100),
    grams: macros,
  };
}
