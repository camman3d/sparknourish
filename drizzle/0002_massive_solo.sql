CREATE TYPE "public"."fitness_goal" AS ENUM('lose', 'maintain', 'build');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "age" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "gender" SET DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "weight_lbs" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "height_feet" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "height_inches" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "activity_level" SET DEFAULT 'sedentary';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "daily_calorie_goal" SET DEFAULT 2000;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "protein_goal_g" SET DEFAULT 150;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "carbs_goal_g" SET DEFAULT 200;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "fat_goal_g" SET DEFAULT 67;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD COLUMN "fiber_g" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD COLUMN "sugar_g" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD COLUMN "sodium_mg" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD COLUMN "cholesterol_mg" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usda_foods" ADD COLUMN "fiber_g" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usda_foods" ADD COLUMN "sugar_g" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usda_foods" ADD COLUMN "sodium_mg" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usda_foods" ADD COLUMN "cholesterol_mg" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fitness_goal" "fitness_goal" DEFAULT 'maintain' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "water_goal_oz" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminders_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "units" text DEFAULT 'imperial' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT true NOT NULL;