// Movement / exercise domain helpers. Kept free of database imports so client
// components can share the calorie estimate the server uses when logging.

export type MovementType = "walk" | "run" | "bike" | "strength" | "yoga" | "other";

export type MovementIntensity = "easy" | "moderate" | "hard";

export type MovementOption = {
  id: MovementType;
  /** Display name, e.g. "Walk". */
  name: string;
  /** Continuous form for the timer pill / completion copy, e.g. "Walking". */
  gerund: string;
  /** Past-simple form for completion copy, e.g. "Nice walk". */
  past: string;
};

export const movementOptions: MovementOption[] = [
  { id: "walk", name: "Walk", gerund: "Walking", past: "walk" },
  { id: "run", name: "Run", gerund: "Running", past: "run" },
  { id: "bike", name: "Bike", gerund: "Biking", past: "ride" },
  { id: "strength", name: "Strength", gerund: "Strength", past: "session" },
  { id: "yoga", name: "Yoga", gerund: "Yoga", past: "flow" },
  { id: "other", name: "Other", gerund: "Moving", past: "workout" },
];

export const movementIntensityOptions: { id: MovementIntensity; name: string }[] = [
  { id: "easy", name: "Easy" },
  { id: "moderate", name: "Moderate" },
  { id: "hard", name: "Hard" },
];

// Metabolic equivalents (MET) for a moderate effort. Intensity scales them.
const MET: Record<MovementType, number> = {
  walk: 3.5,
  run: 8.3,
  bike: 6.8,
  strength: 5,
  yoga: 2.5,
  other: 4,
};

const intensityFactor: Record<MovementIntensity, number> = {
  easy: 0.8,
  moderate: 1,
  hard: 1.25,
};

export function isMovementType(value: unknown): value is MovementType {
  return typeof value === "string" && movementOptions.some((option) => option.id === value);
}

export function isMovementIntensity(value: unknown): value is MovementIntensity {
  return value === "easy" || value === "moderate" || value === "hard";
}

export function movementOption(activity: MovementType): MovementOption {
  return movementOptions.find((option) => option.id === activity) ?? movementOptions[0];
}

export function movementIntensityName(intensity: MovementIntensity): string {
  return movementIntensityOptions.find((option) => option.id === intensity)?.name ?? "Moderate";
}

/** Rough kcal burn — MET x body weight (kg) x hours, rounded. */
export function estimateCalories(input: {
  activity: MovementType;
  durationMin: number;
  intensity: MovementIntensity;
  weightLbs?: number;
}): number {
  const lbs = input.weightLbs && input.weightLbs > 0 ? input.weightLbs : 150;
  const kg = lbs * 0.45359237;
  const met = MET[input.activity] * intensityFactor[input.intensity];
  return Math.round(met * kg * (input.durationMin / 60));
}

/** Weekly goal choices. `minutes: 0` means the user tracks movement without a goal. */
export const weeklyMoveGoalOptions: {
  minutes: number;
  name: string;
  description: string;
  suggested?: boolean;
}[] = [
  { minutes: 90, name: "Ease in", description: "90 min a week, like a 15-minute walk most days" },
  {
    minutes: 150,
    name: "Steady",
    description: "150 min a week, about 30 minutes five days",
    suggested: true,
  },
  { minutes: 250, name: "Active", description: "250 min a week for a bigger push" },
];

export const DEFAULT_WEEKLY_MOVE_GOAL = 150;

export function isWeeklyMoveGoal(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 2000;
}

/** A soft per-day target derived from the weekly goal (five active days). */
export function dailyMoveGoal(weeklyGoalMin: number): number {
  if (!weeklyGoalMin || weeklyGoalMin <= 0) return 0;
  return Math.max(5, Math.round(weeklyGoalMin / 5));
}

/** Formatted mm:ss for the live timer. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Short encouragement based on how far through the target the user is. */
export function timerMessage(pct: number): string {
  if (pct >= 100) return "Goal reached. Any extra time is a bonus.";
  if (pct >= 75) return "Almost there. Finish strong.";
  if (pct >= 45) return "Halfway there. Keep it easy and steady.";
  if (pct >= 20) return "You're moving. Keep it easy and steady.";
  return "Nice start. Settle into a comfortable pace.";
}

/** A short, contextual nudge for the Move screen. */
export function movementTip(remainingMin: number): { title: string; body: string } {
  if (remainingMin <= 0) {
    return {
      title: "Weekly goal reached 🎉",
      body: "Anything else this week is a bonus. Nice work keeping it consistent.",
    };
  }
  const estimate = estimateCalories({ activity: "walk", durationMin: 10, intensity: "moderate" });
  return {
    title: "A short stroll after lunch?",
    body: `10 minutes is about ${estimate} kcal and a good way to close your week goal.`,
  };
}
