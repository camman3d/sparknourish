import { db } from "./index";
import { hashPassword } from "./password";
import { foodLogEntries, users, type NewFoodLogEntry } from "./schema";
import type { MealId } from "../app/_lib/mock-data";

const GOALS = { calories: 2200, protein: 140, carbs: 250, fat: 70 };

type SeedItem = Pick<NewFoodLogEntry, "name" | "quantity" | "calories" | "proteinG" | "carbsG" | "fatG">;

const TODAYS_MEALS: { mealType: MealId; time: string; items: SeedItem[] }[] = [
  {
    mealType: "breakfast",
    time: "7:30 AM",
    items: [
      { name: "Greek yogurt", quantity: "1 cup", calories: 150, proteinG: 20, carbsG: 9, fatG: 4 },
      { name: "Blueberries", quantity: "1/2 cup", calories: 42, proteinG: 1, carbsG: 11, fatG: 0 },
      { name: "Granola", quantity: "1/4 cup", calories: 120, proteinG: 3, carbsG: 18, fatG: 4 },
    ],
  },
  {
    mealType: "lunch",
    time: "12:15 PM",
    items: [
      { name: "Grilled chicken breast", quantity: "6 oz", calories: 280, proteinG: 52, carbsG: 0, fatG: 6 },
      { name: "Brown rice", quantity: "1 cup", calories: 216, proteinG: 5, carbsG: 45, fatG: 2 },
      { name: "Steamed broccoli", quantity: "1 cup", calories: 55, proteinG: 4, carbsG: 11, fatG: 0 },
    ],
  },
  {
    mealType: "dinner",
    time: "6:45 PM",
    items: [
      { name: "Salmon fillet", quantity: "5 oz", calories: 290, proteinG: 34, carbsG: 0, fatG: 16 },
      { name: "Roasted sweet potato", quantity: "1 medium", calories: 112, proteinG: 2, carbsG: 26, fatG: 0 },
    ],
  },
  {
    mealType: "snacks",
    time: "3:00 PM",
    items: [{ name: "Almonds", quantity: "1 oz", calories: 164, proteinG: 6, carbsG: 6, fatG: 14 }],
  },
];

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseTimeOnDate(date: Date, time: string) {
  const match = time.match(/(\d+):(\d+)\s?(AM|PM)/i);
  if (!match) return new Date(date);
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  const result = new Date(date);
  result.setUTCHours(hours, Number(match[2]), 0, 0);
  return result;
}

// Synthetic history for the 29 days before today — one aggregate entry per
// meal type per day, since we only need day/meal-level totals for the
// history charts (not item-level detail like today's real log).
function buildSyntheticHistory(userId: number, today: Date, days: number): NewFoodLogEntry[] {
  const random = mulberry32(42);
  const entries: NewFoodLogEntry[] = [];

  for (let i = days; i >= 1; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    date.setUTCHours(12);
    const wobble = () => random() - 0.5;

    const calories = Math.max(1000, Math.round(GOALS.calories + wobble() * 700 + Math.sin(i / 3.2) * 140));
    const protein = Math.max(50, Math.round(GOALS.protein + wobble() * 45));
    const carbs = Math.max(70, Math.round(GOALS.carbs + wobble() * 80));
    const fat = Math.max(20, Math.round(GOALS.fat + wobble() * 25));

    const breakfastShare = 0.2 + random() * 0.08;
    const lunchShare = 0.3 + random() * 0.08;
    const dinnerShare = 0.28 + random() * 0.08;
    const snacksShare = Math.max(0.06, 1 - breakfastShare - lunchShare - dinnerShare);
    const shareTotal = breakfastShare + lunchShare + dinnerShare + snacksShare;

    const mealShares: [MealId, number][] = [
      ["breakfast", breakfastShare / shareTotal],
      ["lunch", lunchShare / shareTotal],
      ["dinner", dinnerShare / shareTotal],
      ["snacks", snacksShare / shareTotal],
    ];

    for (const [mealType, share] of mealShares) {
      entries.push({
        userId,
        mealType,
        name: "Logged food",
        quantity: "1 day total",
        calories: Math.round(calories * share),
        proteinG: Math.round(protein * share),
        carbsG: Math.round(carbs * share),
        fatG: Math.round(fat * share),
        loggedAt: date,
      });
    }
  }

  return entries;
}

async function main() {
  await db.delete(foodLogEntries);
  await db.delete(users);

  const [user] = await db
    .insert(users)
    .values({
      name: "Josh Monson",
      email: "josh@joshmonson.com",
      passwordHash: hashPassword("password123"),
      age: 34,
      gender: "male",
      weightLbs: 178,
      heightFeet: 5,
      heightInches: 11,
      activityLevel: "moderate",
      dailyCalorieGoal: GOALS.calories,
      proteinGoalG: GOALS.protein,
      carbsGoalG: GOALS.carbs,
      fatGoalG: GOALS.fat,
      openRouterApiKey: "",
    })
    .returning();

  const today = startOfDayUtc(new Date());
  const entries: NewFoodLogEntry[] = [];

  for (const meal of TODAYS_MEALS) {
    const loggedAt = parseTimeOnDate(today, meal.time);
    for (const item of meal.items) {
      entries.push({ ...item, userId: user.id, mealType: meal.mealType, loggedAt });
    }
  }

  entries.push(...buildSyntheticHistory(user.id, today, 29));

  await db.insert(foodLogEntries).values(entries);

  console.log(`Seeded 1 user and ${entries.length} food log entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
