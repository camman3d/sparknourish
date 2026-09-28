import { pgEnum, pgTable, integer, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["female", "male", "other"]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snacks"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  age: integer("age").notNull(),
  gender: genderEnum("gender").notNull(),
  weightLbs: real("weight_lbs").notNull(),
  heightFeet: integer("height_feet").notNull(),
  heightInches: integer("height_inches").notNull(),
  activityLevel: activityLevelEnum("activity_level").notNull(),
  dailyCalorieGoal: integer("daily_calorie_goal").notNull(),
  proteinGoalG: integer("protein_goal_g").notNull(),
  carbsGoalG: integer("carbs_goal_g").notNull(),
  fatGoalG: integer("fat_goal_g").notNull(),
  openRouterApiKey: text("open_router_api_key").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foodLogEntries = pgTable("food_log_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum("meal_type").notNull(),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  calories: integer("calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatG: integer("fat_g").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FoodLogEntry = typeof foodLogEntries.$inferSelect;
export type NewFoodLogEntry = typeof foodLogEntries.$inferInsert;
