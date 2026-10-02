CREATE TABLE "custom_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"serving_size" text NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" real DEFAULT 0 NOT NULL,
	"carbs_g" real DEFAULT 0 NOT NULL,
	"fat_g" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usda_foods" (
	"fdc_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"data_type" text NOT NULL,
	"brand_owner" text,
	"serving_size" text DEFAULT '100g' NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein_g" real DEFAULT 0 NOT NULL,
	"carbs_g" real DEFAULT 0 NOT NULL,
	"fat_g" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_log_entries" ALTER COLUMN "protein_g" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "food_log_entries" ALTER COLUMN "carbs_g" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "food_log_entries" ALTER COLUMN "fat_g" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD CONSTRAINT "custom_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_foods_user_idx" ON "custom_foods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_foods_name_idx" ON "custom_foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "usda_foods_name_idx" ON "usda_foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "usda_foods_data_type_idx" ON "usda_foods" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "food_log_entries_user_date_idx" ON "food_log_entries" USING btree ("user_id","logged_at");