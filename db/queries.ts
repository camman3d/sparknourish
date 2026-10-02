import { and, asc, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "./index";
import {
  customFoods,
  foodLogEntries,
  movementLogEntries,
  usdaFoods,
  users,
  type FoodLogEntry,
  type MovementLogEntry,
  type NewUser,
  type User,
} from "./schema";
import { mealOptions, type DayLog, type HistoryRange, type MealId } from "../app/_lib/mock-data";
import { addDays, dateKey, startOfDayUtc } from "../app/_lib/calendar";
import type { MovementIntensity, MovementType } from "../app/_lib/movement";

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

export async function getMealsForDate(userId: number, date: Date) {
  const dayStart = startOfDayUtc(date);
  const entries = await getEntriesBetween(userId, dayStart, addDays(dayStart, 1));

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

export async function getTodayMeals(userId: number) {
  return getMealsForDate(userId, new Date());
}

export async function getMealEntries(userId: number, mealId: MealId, date?: Date) {
  const dayStart = startOfDayUtc(date ?? new Date());
  const entries = await getEntriesBetween(userId, dayStart, addDays(dayStart, 1));
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
  loggedAt?: Date;
}) {
  const [created] = await db
    .insert(foodLogEntries)
    .values({ ...entry, loggedAt: entry.loggedAt ?? new Date() })
    .returning();
  return created;
}

export async function getHistory(userId: number, days: HistoryRange): Promise<DayLog[]> {
  const todayStart = startOfDayUtc(new Date());
  const rangeStart = addDays(todayStart, -(days - 1));
  const entries = await getEntriesBetween(userId, rangeStart, addDays(todayStart, 1));

  const byDate = new Map<string, FoodLogEntry[]>();
  for (const entry of entries) {
    const key = dateKey(entry.loggedAt);
    const bucket = byDate.get(key);
    if (bucket) bucket.push(entry);
    else byDate.set(key, [entry]);
  }

  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  const labelFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const out: DayLog[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(todayStart, -i);
    const dayEntries = byDate.get(dateKey(day)) ?? [];
    const totals = sumMacros(dayEntries);
    const meals: Record<MealId, number> = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
    for (const entry of dayEntries) meals[entry.mealType] += entry.calories;

    out.push({
      date: dateKey(day),
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
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    cholesterolMg?: number;
  }
) {
  const [created] = await db
    .insert(customFoods)
    .values({ ...food, userId })
    .returning();
  return created;
}

export type FoodDetail = {
  id: string;
  source: "custom" | "usda";
  name: string;
  subtitle: string | null;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
};

const usdaDataTypeLabels: Record<string, string> = {
  survey_fndds_food: "Survey food",
  sr_legacy_food: "Standard reference",
  foundation_food: "Foundation food",
  branded_food: "Branded",
};

/**
 * Look up a food for the detail screen. `id` is the same prefixed id used by
 * the Add-food search (`custom-123` / `usda-456`).
 */
export async function getFoodDetail(userId: number, id: string): Promise<FoodDetail | null> {
  if (id.startsWith("custom-")) {
    const foodId = Number(id.slice("custom-".length));
    if (!Number.isInteger(foodId)) return null;
    const [food] = await db
      .select()
      .from(customFoods)
      .where(and(eq(customFoods.id, foodId), eq(customFoods.userId, userId)))
      .limit(1);
    if (!food) return null;
    return {
      id,
      source: "custom",
      name: food.name,
      subtitle: "Custom food",
      servingSize: food.servingSize,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      fiberG: food.fiberG,
      sugarG: food.sugarG,
      sodiumMg: food.sodiumMg,
      cholesterolMg: food.cholesterolMg,
    };
  }

  if (id.startsWith("usda-")) {
    const fdcId = Number(id.slice("usda-".length));
    if (!Number.isInteger(fdcId)) return null;
    const [food] = await db.select().from(usdaFoods).where(eq(usdaFoods.fdcId, fdcId)).limit(1);
    if (!food) return null;
    return {
      id,
      source: "usda",
      name: food.name,
      subtitle: food.brandOwner || usdaDataTypeLabels[food.dataType] || null,
      servingSize: food.servingSize,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      fiberG: food.fiberG,
      sugarG: food.sugarG,
      sodiumMg: food.sodiumMg,
      cholesterolMg: food.cholesterolMg,
    };
  }

  return null;
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

export type RecentFood = {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

/**
 * Distinct foods the user has logged most recently, for the "Recent & frequent"
 * list on the Add food screen. One row per food name (the latest logged portion).
 */
export async function getRecentFoods(userId: number, limit = 6): Promise<RecentFood[]> {
  const result = await db.execute(sql`
    select distinct on (name)
      name, quantity, calories, protein_g, carbs_g, fat_g, logged_at
    from food_log_entries
    where user_id = ${userId}
    order by name asc, logged_at desc
  `);

  type Row = {
    name: string;
    quantity: string;
    calories: number;
    protein_g: string | number;
    carbs_g: string | number;
    fat_g: string | number;
    logged_at: string | Date;
  };

  return Array.from(result as unknown as Row[])
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      quantity: row.quantity,
      calories: row.calories,
      proteinG: Number(row.protein_g),
      carbsG: Number(row.carbs_g),
      fatG: Number(row.fat_g),
    }));
}

// --- Movement / exercise -----------------------------------------------------

async function getMovementBetween(userId: number, start: Date, end: Date) {
  return db
    .select()
    .from(movementLogEntries)
    .where(
      and(
        eq(movementLogEntries.userId, userId),
        gte(movementLogEntries.loggedAt, start),
        lt(movementLogEntries.loggedAt, end)
      )
    )
    .orderBy(desc(movementLogEntries.loggedAt), desc(movementLogEntries.id));
}

function sumMovement(entries: MovementLogEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      minutes: totals.minutes + entry.durationMin,
      calories: totals.calories + entry.calories,
    }),
    { minutes: 0, calories: 0 }
  );
}

export type MovementDay = {
  key: string;
  weekday: string;
  minutes: number;
  isToday: boolean;
  isFuture: boolean;
};

export type MovementOverview = {
  today: { minutes: number; calories: number; entries: MovementLogEntry[] };
  week: { totalMinutes: number; days: MovementDay[]; movedDays: number };
  recent: MovementLogEntry[];
};

/** Movement logged on a single day — used by the Diary's Move card. */
export async function getMovementForDate(userId: number, date: Date) {
  const dayStart = startOfDayUtc(date);
  const entries = await getMovementBetween(userId, dayStart, addDays(dayStart, 1));
  return { ...sumMovement(entries), entries };
}

/** Today + the Monday–Sunday week containing it, plus the most recent entries. */
export async function getMovementOverview(
  userId: number,
  date = new Date()
): Promise<MovementOverview> {
  const dayStart = startOfDayUtc(date);
  const dow = dayStart.getUTCDay(); // 0 = Sunday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = addDays(dayStart, mondayOffset);
  const weekEnd = addDays(weekStart, 7);

  const [weekEntries, recent] = await Promise.all([
    getMovementBetween(userId, weekStart, weekEnd),
    db
      .select()
      .from(movementLogEntries)
      .where(eq(movementLogEntries.userId, userId))
      .orderBy(desc(movementLogEntries.loggedAt), desc(movementLogEntries.id))
      .limit(4),
  ]);

  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  const todayKey = dateKey(dayStart);

  const days: MovementDay[] = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const key = dateKey(day);
    const minutes = weekEntries
      .filter((entry) => dateKey(entry.loggedAt) === key)
      .reduce((sum, entry) => sum + entry.durationMin, 0);
    return {
      key,
      weekday: weekdayFmt.format(day),
      minutes,
      isToday: key === todayKey,
      isFuture: day.getTime() > dayStart.getTime(),
    };
  });

  const todayEntries = weekEntries.filter((entry) => dateKey(entry.loggedAt) === todayKey);

  return {
    today: { ...sumMovement(todayEntries), entries: todayEntries },
    week: {
      totalMinutes: sumMovement(weekEntries).minutes,
      movedDays: days.filter((day) => day.minutes > 0).length,
      days,
    },
    recent,
  };
}

export async function getMovementEntry(
  userId: number,
  entryId: number
): Promise<MovementLogEntry | null> {
  const [entry] = await db
    .select()
    .from(movementLogEntries)
    .where(and(eq(movementLogEntries.id, entryId), eq(movementLogEntries.userId, userId)))
    .limit(1);
  return entry ?? null;
}

export async function addMovementEntry(entry: {
  userId: number;
  activity: MovementType;
  durationMin: number;
  intensity: MovementIntensity;
  calories: number;
  loggedAt?: Date;
}) {
  const [created] = await db
    .insert(movementLogEntries)
    .values({ ...entry, loggedAt: entry.loggedAt ?? new Date() })
    .returning();
  return created;
}

export async function updateMovementEntry(
  userId: number,
  entryId: number,
  patch: Partial<{
    activity: MovementType;
    durationMin: number;
    intensity: MovementIntensity;
    calories: number;
  }>
) {
  const [updated] = await db
    .update(movementLogEntries)
    .set(patch)
    .where(and(eq(movementLogEntries.id, entryId), eq(movementLogEntries.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteMovementEntry(userId: number, entryId: number) {
  const [deleted] = await db
    .delete(movementLogEntries)
    .where(and(eq(movementLogEntries.id, entryId), eq(movementLogEntries.userId, userId)))
    .returning();
  return deleted ?? null;
}

