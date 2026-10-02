import { boolean, index, integer, pgEnum, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["female", "male", "other"]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snacks"]);

export const fitnessGoalEnum = pgEnum("fitness_goal", ["lose", "maintain", "build"]);

export const movementTypeEnum = pgEnum("movement_type", [
  "walk",
  "run",
  "bike",
  "strength",
  "yoga",
  "other",
]);

export const movementIntensityEnum = pgEnum("movement_intensity", ["easy", "moderate", "hard"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // Health profile is collected during the guided onboarding that runs after
  // signup, so these columns carry defaults until the user completes it.
  age: integer("age").notNull().default(0),
  gender: genderEnum("gender").notNull().default("other"),
  weightLbs: real("weight_lbs").notNull().default(0),
  heightFeet: integer("height_feet").notNull().default(0),
  heightInches: integer("height_inches").notNull().default(0),
  activityLevel: activityLevelEnum("activity_level").notNull().default("sedentary"),
  dailyCalorieGoal: integer("daily_calorie_goal").notNull().default(2000),
  proteinGoalG: integer("protein_goal_g").notNull().default(150),
  carbsGoalG: integer("carbs_goal_g").notNull().default(200),
  fatGoalG: integer("fat_goal_g").notNull().default(67),
  fitnessGoal: fitnessGoalEnum("fitness_goal").notNull().default("maintain"),
  waterGoalOz: integer("water_goal_oz").notNull().default(80),
  // Weekly movement target in minutes. 0 means "no goal, just track food".
  weeklyMoveGoalMin: integer("weekly_move_goal_min").notNull().default(150),
  // When true, calories burned through movement are added back to the daily budget.
  addExerciseToBudget: boolean("add_exercise_to_budget").notNull().default(true),
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
  units: text("units").notNull().default("imperial"),
  // IANA time zone (e.g. "America/New_York") used to bucket food, movement and
  // water logs into the user's local calendar days. Kept in sync with the
  // browser; falls back to UTC when unset/unknown.
  timezone: text("timezone").notNull().default("UTC"),
  // Defaults to true so existing accounts are never forced back through
  // onboarding; the signup route explicitly inserts `false`.
  onboardingCompleted: boolean("onboarding_completed").notNull().default(true),
  openRouterApiKey: text("open_router_api_key").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foodLogEntries = pgTable(
  "food_log_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mealType: mealTypeEnum("meal_type").notNull(),
    name: text("name").notNull(),
    quantity: text("quantity").notNull(),
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").notNull(),
    carbsG: real("carbs_g").notNull(),
    fatG: real("fat_g").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("food_log_entries_user_date_idx").on(table.userId, table.loggedAt),
  ]
);

export const movementLogEntries = pgTable(
  "movement_log_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activity: movementTypeEnum("activity").notNull(),
    durationMin: integer("duration_min").notNull(),
    intensity: movementIntensityEnum("intensity").notNull().default("moderate"),
    calories: integer("calories").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("movement_log_entries_user_date_idx").on(table.userId, table.loggedAt),
  ]
);

export const waterLogEntries = pgTable(
  "water_log_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountOz: integer("amount_oz").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("water_log_entries_user_date_idx").on(table.userId, table.loggedAt),
  ]
);

export const customFoods = pgTable(
  "custom_foods",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    servingSize: text("serving_size").notNull(),
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").notNull().default(0),
    carbsG: real("carbs_g").notNull().default(0),
    fatG: real("fat_g").notNull().default(0),
    fiberG: real("fiber_g").notNull().default(0),
    sugarG: real("sugar_g").notNull().default(0),
    sodiumMg: real("sodium_mg").notNull().default(0),
    cholesterolMg: real("cholesterol_mg").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("custom_foods_user_idx").on(table.userId),
    index("custom_foods_name_idx").on(table.name),
  ]
);

// Reusable meal templates ("My meals"). A saved meal is a named collection of
// item rows; staging one drops every item into the Add-food cart in one tap.
export const savedMeals = pgTable(
  "saved_meals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("saved_meals_user_idx").on(table.userId)]
);

export const savedMealItems = pgTable(
  "saved_meal_items",
  {
    id: serial("id").primaryKey(),
    savedMealId: integer("saved_meal_id")
      .notNull()
      .references(() => savedMeals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    quantity: text("quantity").notNull(),
    calories: integer("calories").notNull().default(0),
    proteinG: real("protein_g").notNull().default(0),
    carbsG: real("carbs_g").notNull().default(0),
    fatG: real("fat_g").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("saved_meal_items_meal_idx").on(table.savedMealId)]
);

export const usdaFoods = pgTable(
  "usda_foods",
  {
    fdcId: integer("fdc_id").primaryKey(),
    name: text("name").notNull(),
    dataType: text("data_type").notNull(),
    brandOwner: text("brand_owner"),
    servingSize: text("serving_size").notNull().default("100g"),
    calories: integer("calories").notNull().default(0),
    proteinG: real("protein_g").notNull().default(0),
    carbsG: real("carbs_g").notNull().default(0),
    fatG: real("fat_g").notNull().default(0),
    fiberG: real("fiber_g").notNull().default(0),
    sugarG: real("sugar_g").notNull().default(0),
    sodiumMg: real("sodium_mg").notNull().default(0),
    cholesterolMg: real("cholesterol_mg").notNull().default(0),
  },
  (table) => [
    index("usda_foods_name_idx").on(table.name),
    index("usda_foods_data_type_idx").on(table.dataType),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FoodLogEntry = typeof foodLogEntries.$inferSelect;
export type NewFoodLogEntry = typeof foodLogEntries.$inferInsert;
export type MovementLogEntry = typeof movementLogEntries.$inferSelect;
export type NewMovementLogEntry = typeof movementLogEntries.$inferInsert;
export type WaterLogEntry = typeof waterLogEntries.$inferSelect;
export type NewWaterLogEntry = typeof waterLogEntries.$inferInsert;
export type CustomFood = typeof customFoods.$inferSelect;
export type NewCustomFood = typeof customFoods.$inferInsert;
export type SavedMeal = typeof savedMeals.$inferSelect;
export type NewSavedMeal = typeof savedMeals.$inferInsert;
export type SavedMealItem = typeof savedMealItems.$inferSelect;
export type NewSavedMealItem = typeof savedMealItems.$inferInsert;
export type UsdaFood = typeof usdaFoods.$inferSelect;
export type NewUsdaFood = typeof usdaFoods.$inferInsert;

