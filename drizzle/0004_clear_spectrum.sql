CREATE TABLE "water_log_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount_oz" integer NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "water_log_entries" ADD CONSTRAINT "water_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "water_log_entries_user_date_idx" ON "water_log_entries" USING btree ("user_id","logged_at");