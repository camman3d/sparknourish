import { and, asc, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { db } from "./index";
import {
  customFoods,
  foodLogEntries,
  usdaFoods,
  users,
  type FoodLogEntry,
  type NewUser,
  type User,
} from "./schema";
import { mealOptions, type DayLog, type HistoryRange, type MealId } from "../app/_lib/mock-data";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const publicUser: PublicUser & { passwordHash?: string } = { ...user };
  delete publicUser.passwordHash;
  return publicUser;
}

export async function updateUser(userId: number, patch: Partial<NewUser>) {
  const [updated] = await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateKeyUtc(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date);
}

function sumMacros(entries: FoodLogEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.proteinG,
      carbs: totals.carbs + entry.carbsG,
      fat: totals.fat + entry.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

async function getEntriesBetween(userId: number, start: Date, end: Date) {
  return db
    .select()
    .from(foodLogEntries)
    .where(
      and(
        eq(foodLogEntries.userId, userId),
        gte(foodLogEntries.loggedAt, start),
        lt(foodLogEntries.loggedAt, end)
      )
    )
    .orderBy(asc(foodLogEntries.loggedAt));
}

export type MealSummary = {
  id: MealId;
  name: string;
  time: string | null;
  items: FoodLogEntry[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
};

export async function getTodayMeals(userId: number) {
  const today = startOfDayUtc(new Date());
  const entries = await getEntriesBetween(userId, today, addDays(today, 1));

  const meals: MealSummary[] = mealOptions.map((option) => {
    const items = entries.filter((entry) => entry.mealType === option.id);
    return {
      id: option.id,
      name: option.name,
      time: items.length ? formatTime(items[0].loggedAt) : null,
      items,
      totals: sumMacros(items),
    };
  });

  return { meals, totals: sumMacros(entries) };
}

export async function getMealEntries(userId: number, mealId: MealId) {
  const today = startOfDayUtc(new Date());
  const entries = await getEntriesBetween(userId, today, addDays(today, 1));
  return entries.filter((entry) => entry.mealType === mealId);
}

export async function getLastLoggedMealToday(userId: number): Promise<MealId | null> {
  const today = startOfDayUtc(new Date());
  const [latest] = await db
    .select({ mealType: foodLogEntries.mealType })
    .from(foodLogEntries)
    .where(
      and(
        eq(foodLogEntries.userId, userId),
        gte(foodLogEntries.loggedAt, today),
        lt(foodLogEntries.loggedAt, addDays(today, 1))
      )
    )
    .orderBy(desc(foodLogEntries.createdAt))
    .limit(1);
  return latest?.mealType ?? null;
}

export async function addFoodLogEntry(entry: {
  userId: number;
  mealType: MealId;
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  const [created] = await db
    .insert(foodLogEntries)
    .values({ ...entry, loggedAt: new Date() })
    .returning();
  return created;
}

export async function getHistory(userId: number, days: HistoryRange): Promise<DayLog[]> {
  const todayStart = startOfDayUtc(new Date());
  const rangeStart = addDays(todayStart, -(days - 1));
  const entries = await getEntriesBetween(userId, rangeStart, addDays(todayStart, 1));

  const byDate = new Map<string, FoodLogEntry[]>();
  for (const entry of entries) {
    const key = dateKeyUtc(entry.loggedAt);
    const bucket = byDate.get(key);
    if (bucket) bucket.push(entry);
    else byDate.set(key, [entry]);
  }

  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  const labelFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const out: DayLog[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(todayStart, -i);
    const dayEntries = byDate.get(dateKeyUtc(day)) ?? [];
    const totals = sumMacros(dayEntries);
    const meals: Record<MealId, number> = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
    for (const entry of dayEntries) meals[entry.mealType] += entry.calories;

    out.push({
      date: dateKeyUtc(day),
      label: labelFmt.format(day),
      weekday: weekdayFmt.format(day),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      meals,
    });
  }
  return out;
}

export async function deleteFoodLogEntry(userId: number, entryId: number) {
  const [deleted] = await db
    .delete(foodLogEntries)
    .where(and(eq(foodLogEntries.id, entryId), eq(foodLogEntries.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function updateFoodLogEntry(
  userId: number,
  entryId: number,
  patch: Partial<{
    name: string;
    quantity: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    mealType: MealId;
  }>
) {
  const [updated] = await db
    .update(foodLogEntries)
    .set(patch)
    .where(and(eq(foodLogEntries.id, entryId), eq(foodLogEntries.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function createCustomFood(
  userId: number,
  food: {
    name: string;
    servingSize: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }
) {
  const [created] = await db
    .insert(customFoods)
    .values({ ...food, userId })
    .returning();
  return created;
}

export async function getCustomFoods(userId: number) {
  return db
    .select()
    .from(customFoods)
    .where(eq(customFoods.userId, userId))
    .orderBy(desc(customFoods.createdAt));
}

export async function deleteCustomFood(userId: number, foodId: number) {
  const [deleted] = await db
    .delete(customFoods)
    .where(and(eq(customFoods.id, foodId), eq(customFoods.userId, userId)))
    .returning();
  return deleted ?? null;
}

export async function searchFoods(userId: number, query: string, limit = 25) {
  const q = query.trim();
  if (!q) {
    const userCustom = await db
      .select()
      .from(customFoods)
      .where(eq(customFoods.userId, userId))
      .orderBy(desc(customFoods.createdAt))
      .limit(10);

    const commonUsda = await db
      .select()
      .from(usdaFoods)
      .where(eq(usdaFoods.dataType, "survey_fndds_food"))
      .limit(15);

    return { custom: userCustom, usda: commonUsda };
  }

  const pattern = `%${q}%`;
  const [customMatches, usdaMatches] = await Promise.all([
    db
      .select()
      .from(customFoods)
      .where(and(eq(customFoods.userId, userId), ilike(customFoods.name, pattern)))
      .limit(10),
    db
      .select()
      .from(usdaFoods)
      .where(or(ilike(usdaFoods.name, pattern), ilike(usdaFoods.brandOwner, pattern)))
      .limit(limit),
  ]);

  return { custom: customMatches, usda: usdaMatches };
}

