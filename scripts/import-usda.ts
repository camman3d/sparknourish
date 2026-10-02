import fs from "node:fs";
import readline from "node:readline";
import { config } from "dotenv";
import yauzl from "yauzl";
import { parse } from "csv-parse";
import { db } from "../db";
import { usdaFoods, type NewUsdaFood } from "../db/schema";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

const DEFAULT_ZIP = "C:\\Users\\Josh\\Downloads\\FoodData_Central_csv_2026-04-30.zip";

// Nutrient IDs in FoodData Central
const NUTRIENT_ENERGY = 1008;
const NUTRIENT_ENERGY_ATWATER_GEN = 2047;
const NUTRIENT_ENERGY_ATWATER_SPEC = 2048;
const NUTRIENT_PROTEIN = 1003;
const NUTRIENT_FAT = 1004;
const NUTRIENT_CARBS = 1005;
const NUTRIENT_FIBER = 1079;
const NUTRIENT_SUGAR = 2000;
const NUTRIENT_SODIUM = 1093;
const NUTRIENT_CHOLESTEROL = 1253;

type FoodMeta = {
  fdcId: number;
  name: string;
  dataType: string;
  brandOwner?: string;
  servingSize?: string;
};

type NutrientAccumulator = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
};

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      resolve(zip);
    });
  });
}

function findEntry(zip: yauzl.ZipFile, name: string): Promise<yauzl.Entry | null> {
  return new Promise((resolve) => {
    let found = false;
    zip.on("entry", (entry: yauzl.Entry) => {
      const baseName = entry.fileName.split("/").pop();
      if (baseName === name) {
        found = true;
        resolve(entry);
      } else {
        zip.readEntry();
      }
    });
    zip.on("end", () => {
      if (!found) resolve(null);
    });
    zip.readEntry();
  });
}

function getStreamForEntry(zip: yauzl.ZipFile, entry: yauzl.Entry): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (err, stream) => {
      if (err) return reject(err);
      resolve(stream);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const zipPath = args.find((a) => !a.startsWith("--")) || process.env.USDA_ZIP_PATH || DEFAULT_ZIP;
  const includeBranded = args.includes("--all-branded") || args.includes("--include-branded");
  const brandedLimitArg = args.find((a) => a.startsWith("--branded-limit="));
  const brandedLimit = brandedLimitArg ? parseInt(brandedLimitArg.split("=")[1], 10) : includeBranded ? Infinity : 20000;

  if (!fs.existsSync(zipPath)) {
    console.error(`USDA zip file not found at: ${zipPath}`);
    console.error(`Usage: npm run db:import-usda [path/to/FoodData_Central.zip] [--include-branded] [--branded-limit=N]`);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`USDA FoodData Central Importer`);
  console.log(`Zip file: ${zipPath}`);
  console.log(`Branded foods limit: ${brandedLimit === Infinity ? "All (2M+)" : brandedLimit}`);
  console.log(`========================================\n`);

  // Step 1: Discover foods to import from food.csv
  console.log(`[1/4] Reading food metadata from food.csv...`);
  const zip1 = await openZip(zipPath);
  const foodEntry = await findEntry(zip1, "food.csv");
  if (!foodEntry) throw new Error("Could not find food.csv in zip archive");

  const foodStream = await getStreamForEntry(zip1, foodEntry);
  const parser1 = foodStream.pipe(parse({ columns: true, skip_empty_lines: true }));

  const targetFoods = new Map<number, FoodMeta>();
  let brandedCount = 0;

  for await (const row of parser1) {
    const fdcId = parseInt(row.fdc_id, 10);
    const dataType = row.data_type;
    const description = (row.description || "").trim();

    if (!fdcId || !description) continue;

    const isCore =
      dataType === "survey_fndds_food" ||
      dataType === "sr_legacy_food" ||
      dataType === "foundation_food";

    if (isCore) {
      targetFoods.set(fdcId, { fdcId, name: description, dataType });
    } else if (dataType === "branded_food") {
      if (brandedCount < brandedLimit) {
        targetFoods.set(fdcId, { fdcId, name: description, dataType });
        brandedCount++;
      }
    }
  }
  zip1.close();
  console.log(`Found ${targetFoods.size} candidate foods (${targetFoods.size - brandedCount} whole/standard, ${brandedCount} branded).`);

  // Step 2: Read portions from food_portion.csv
  console.log(`[2/4] Reading portion sizes from food_portion.csv...`);
  const zip2 = await openZip(zipPath);
  const portionEntry = await findEntry(zip2, "food_portion.csv");
  if (portionEntry) {
    const portionStream = await getStreamForEntry(zip2, portionEntry);
    const parser2 = portionStream.pipe(parse({ columns: true, skip_empty_lines: true }));

    for await (const row of parser2) {
      const fdcId = parseInt(row.fdc_id, 10);
      const food = targetFoods.get(fdcId);
      if (!food || food.servingSize) continue;

      const desc = (row.portion_description || "").trim();
      const modifier = (row.modifier || "").trim();
      const amount = row.amount && row.amount !== "1" && row.amount !== "1.0" ? `${row.amount} ` : "";
      const gramWeight = row.gram_weight ? `${Math.round(parseFloat(row.gram_weight))}g` : "";

      const label = desc || modifier;
      if (label && gramWeight) {
        food.servingSize = `${amount}${label} (${gramWeight})`;
      } else if (label) {
        food.servingSize = `${amount}${label}`;
      } else if (gramWeight) {
        food.servingSize = gramWeight;
      }
    }
  }
  zip2.close();

  // If branded foods were included, read serving sizes and brand names from branded_food.csv
  if (brandedCount > 0) {
    console.log(`Reading brand metadata from branded_food.csv...`);
    const zipBranded = await openZip(zipPath);
    const brandedEntry = await findEntry(zipBranded, "branded_food.csv");
    if (brandedEntry) {
      const brandedStream = await getStreamForEntry(zipBranded, brandedEntry);
      const parserB = brandedStream.pipe(parse({ columns: true, skip_empty_lines: true }));

      for await (const row of parserB) {
        const fdcId = parseInt(row.fdc_id, 10);
        const food = targetFoods.get(fdcId);
        if (!food) continue;

        if (row.brand_owner || row.brand_name) {
          food.brandOwner = (row.brand_name || row.brand_owner || "").trim();
        }

        if (!food.servingSize) {
          const household = (row.household_serving_fulltext || "").trim();
          const size = row.serving_size ? String(row.serving_size) : "";
          const unit = (row.serving_size_unit || "").trim();

          if (household && size && unit) {
            food.servingSize = `${household} (${size}${unit})`;
          } else if (household) {
            food.servingSize = household;
          } else if (size && unit) {
            food.servingSize = `${size} ${unit}`;
          }
        }
      }
    }
    zipBranded.close();
  }

  // Step 3: Stream food_nutrient.csv to aggregate macros for target foods
  console.log(`[3/4] Streaming nutrients from food_nutrient.csv (this takes ~15-30s)...`);
  const nutrientsMap = new Map<number, NutrientAccumulator>();

  const zip3 = await openZip(zipPath);
  const nutrientEntry = await findEntry(zip3, "food_nutrient.csv");
  if (!nutrientEntry) throw new Error("Could not find food_nutrient.csv in zip archive");

  const nutrientStream = await getStreamForEntry(zip3, nutrientEntry);
  const rl = readline.createInterface({
    input: nutrientStream as unknown as NodeJS.ReadableStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    lineCount++;
    if (lineCount % 1_000_000 === 0) {
      process.stdout.write(`  Processed ${(lineCount / 1_000_000).toFixed(0)}M nutrient rows...\r`);
    }

    // food_nutrient.csv line format: "id","fdc_id","nutrient_id","amount",...
    // Quick substring parse for high performance instead of full regex on 10M rows
    const firstComma = line.indexOf(",");
    if (firstComma === -1) continue;
    const secondComma = line.indexOf(",", firstComma + 1);
    if (secondComma === -1) continue;
    const thirdComma = line.indexOf(",", secondComma + 1);
    if (thirdComma === -1) continue;
    const fourthComma = line.indexOf(",", thirdComma + 1);

    const fdcIdStr = line.slice(firstComma + 1, secondComma).replace(/"/g, "");
    const fdcId = parseInt(fdcIdStr, 10);
    if (!targetFoods.has(fdcId)) continue;

    const nutrientIdStr = line.slice(secondComma + 1, thirdComma).replace(/"/g, "");
    const nutrientId = parseInt(nutrientIdStr, 10);

    const amountStr = (fourthComma === -1 ? line.slice(thirdComma + 1) : line.slice(thirdComma + 1, fourthComma)).replace(/"/g, "");
    const amount = parseFloat(amountStr) || 0;

    let acc = nutrientsMap.get(fdcId);
    if (!acc) {
      acc = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0, cholesterolMg: 0 };
      nutrientsMap.set(fdcId, acc);
    }

    if (nutrientId === NUTRIENT_ENERGY || nutrientId === NUTRIENT_ENERGY_ATWATER_GEN || nutrientId === NUTRIENT_ENERGY_ATWATER_SPEC) {
      if (acc.calories === 0) acc.calories = Math.round(amount);
    } else if (nutrientId === NUTRIENT_PROTEIN) {
      acc.proteinG = Math.round(amount * 10) / 10;
    } else if (nutrientId === NUTRIENT_CARBS) {
      acc.carbsG = Math.round(amount * 10) / 10;
    } else if (nutrientId === NUTRIENT_FAT) {
      acc.fatG = Math.round(amount * 10) / 10;
    } else if (nutrientId === NUTRIENT_FIBER) {
      acc.fiberG = Math.round(amount * 10) / 10;
    } else if (nutrientId === NUTRIENT_SUGAR) {
      acc.sugarG = Math.round(amount * 10) / 10;
    } else if (nutrientId === NUTRIENT_SODIUM) {
      acc.sodiumMg = Math.round(amount);
    } else if (nutrientId === NUTRIENT_CHOLESTEROL) {
      acc.cholesterolMg = Math.round(amount);
    }
  }
  zip3.close();
  console.log(`\nAggregated nutrients for ${nutrientsMap.size} foods.`);

  // Step 4: Batch insert into usda_foods table
  console.log(`[4/4] Inserting into usda_foods table...`);
  const foodsToInsert: NewUsdaFood[] = [];

  for (const [fdcId, meta] of targetFoods.entries()) {
    const nut =
      nutrientsMap.get(fdcId) || {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        sugarG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
      };
    foodsToInsert.push({
      fdcId,
      name: meta.name,
      dataType: meta.dataType,
      brandOwner: meta.brandOwner || null,
      servingSize: meta.servingSize || "100g",
      calories: nut.calories,
      proteinG: nut.proteinG,
      carbsG: nut.carbsG,
      fatG: nut.fatG,
      fiberG: nut.fiberG,
      sugarG: nut.sugarG,
      sodiumMg: nut.sodiumMg,
      cholesterolMg: nut.cholesterolMg,
    });
  }

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < foodsToInsert.length; i += BATCH_SIZE) {
    const chunk = foodsToInsert.slice(i, i + BATCH_SIZE);
    await db
      .insert(usdaFoods)
      .values(chunk)
      .onConflictDoUpdate({
        target: usdaFoods.fdcId,
        set: {
          name: sql`excluded.name`,
          dataType: sql`excluded.data_type`,
          brandOwner: sql`excluded.brand_owner`,
          servingSize: sql`excluded.serving_size`,
          calories: sql`excluded.calories`,
          proteinG: sql`excluded.protein_g`,
          carbsG: sql`excluded.carbs_g`,
          fatG: sql`excluded.fat_g`,
          fiberG: sql`excluded.fiber_g`,
          sugarG: sql`excluded.sugar_g`,
          sodiumMg: sql`excluded.sodium_mg`,
          cholesterolMg: sql`excluded.cholesterol_mg`,
        },
      });
    inserted += chunk.length;
    process.stdout.write(`  Inserted ${inserted}/${foodsToInsert.length} foods...\r`);
  }

  console.log(`\nSuccessfully imported ${inserted} USDA foods into the database!`);
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
