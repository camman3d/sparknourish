CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'other');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snacks');--> statement-breakpoint
CREATE TABLE "food_log_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"name" text NOT NULL,
	"quantity" text NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"carbs_g" integer NOT NULL,
	"fat_g" integer NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"age" integer NOT NULL,
	"gender" "gender" NOT NULL,
	"weight_lbs" real NOT NULL,
	"height_feet" integer NOT NULL,
	"height_inches" integer NOT NULL,
	"activity_level" "activity_level" NOT NULL,
	"daily_calorie_goal" integer NOT NULL,
	"protein_goal_g" integer NOT NULL,
	"carbs_goal_g" integer NOT NULL,
	"fat_goal_g" integer NOT NULL,
	"open_router_api_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "food_log_entries" ADD CONSTRAINT "food_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;