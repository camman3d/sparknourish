// Pure helpers for turning a stored serving-size string (e.g. "1 breast
// (150g)") into a gram weight + a human label, and for scaling nutrients.

export const OZ_PER_GRAM = 28.349523125;

export type ParsedServing = {
  /** Gram weight of the base serving, when the string includes one. */
  grams: number | null;
  /** The household portion, e.g. "1 breast" / "1 medium" / "1 cup". */
  label: string;
};

const GRAM_PATTERN = /(\d+(?:\.\d+)?)\s*g(?:rams?)?\b/i;

/**
 * Parse a serving-size string into a gram weight (if present) and a household
 * label. Handles the formats produced by the USDA importer, e.g.
 * "1 medium (118g)", "100 g", "2 tbsp (32g)", "1 cup".
 */
export function parseServing(servingSize: string): ParsedServing {
  const value = (servingSize || "").trim();
  if (!value) return { grams: null, label: "1 serving" };

  const parenMatch = value.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  let label = parenMatch ? parenMatch[1].trim() : value;
  let grams: number | null = null;

  if (parenMatch) {
    const inner = parenMatch[2].match(GRAM_PATTERN);
    if (inner) grams = Number(inner[1]);
  }
  if (grams === null) {
    const direct = value.match(GRAM_PATTERN);
    if (direct) {
      grams = Number(direct[1]);
      // Strip the gram token when it is the whole serving (e.g. "100 g").
      label = value.replace(GRAM_PATTERN, "").replace(/[()]/g, "").trim();
    }
  }

  if (grams !== null && (!Number.isFinite(grams) || grams <= 0)) grams = null;
  if (!label || /^\d+(?:\.\d+)?$/.test(label)) label = "1 serving";

  return { grams, label };
}

export type ServingUnit = "g" | "oz" | "serving";

/**
 * Multiplier applied to a food's base-serving nutrients given the currently
 * selected unit + amount.
 */
export function servingMultiplier(
  unit: ServingUnit,
  amount: number,
  baseGrams: number | null
): number {
  if (unit === "serving") return amount;
  if (!baseGrams) return amount;
  const grams = unit === "g" ? amount : amount * OZ_PER_GRAM;
  return grams / baseGrams;
}

/** Convert the currently selected amount into another unit. */
export function convertServing(
  unit: ServingUnit,
  amount: number,
  next: ServingUnit,
  baseGrams: number | null
): number {
  const multiplier = servingMultiplier(unit, amount, baseGrams);
  if (next === "serving") return Math.max(0.5, Math.round(multiplier * 2) / 2);
  if (!baseGrams) return amount;
  const grams = baseGrams * multiplier;
  return next === "g" ? grams : grams / OZ_PER_GRAM;
}

/** Format an amount for display next to the serving controls. */
export function formatServingAmount(unit: ServingUnit, amount: number, baseGrams: number | null): string {
  if (unit === "g") return String(Math.round(amount));
  if (unit === "oz") return (Math.round(amount * 10) / 10).toString();
  if (baseGrams) {
    const scaled = amount;
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  }
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
}

/** "1 breast" → "breast", "1 medium" → "medium", "100 g" → "g". */
export function servingNoun(label: string): string {
  const match = label.match(/^\s*\d+(?:\.\d+)?\s+(.*)$/);
  const noun = (match ? match[1] : label).trim();
  return noun || "serving";
}
