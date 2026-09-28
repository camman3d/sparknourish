import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const dbUrl = new URL(process.env.DATABASE_URL!);
const dbName = dbUrl.pathname.slice(1);

async function main() {
  const adminUrl = new URL(dbUrl);
  adminUrl.pathname = "/postgres";

  const sql = postgres(adminUrl.toString(), { max: 1 });
  const exists = await sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
  if (exists.length === 0) {
    await sql.unsafe(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database "${dbName}".`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
