import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
}

const sql = postgres(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
