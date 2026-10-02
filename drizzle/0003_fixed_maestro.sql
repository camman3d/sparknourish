CREATE TYPE "public"."movement_intensity" AS ENUM('easy', 'moderate', 'hard');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('walk', 'run', 'bike', 'strength', 'yoga', 'other');--> statement-breakpoint
CREATE TABLE "movement_log_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity" "movement_type" NOT NULL,
	"duration_min" integer NOT NULL,
	"intensity" "movement_intensity" DEFAULT 'moderate' NOT NULL,
	"calories" integer NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_move_goal_min" integer DEFAULT 150 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "add_exercise_to_budget" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "movement_log_entries" ADD CONSTRAINT "movement_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movement_log_entries_user_date_idx" ON "movement_log_entries" USING btree ("user_id","logged_at");