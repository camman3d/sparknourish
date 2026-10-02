import { Apple, Moon, Soup, Sunrise, type LucideIcon } from "lucide-react";
import type { MealId } from "../_lib/mock-data";

export const mealIcons: Record<MealId, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Soup,
  snacks: Apple,
  dinner: Moon,
};

/** Background + foreground tint classes for each meal badge. */
export const mealTint: Record<MealId, string> = {
  breakfast: "bg-amber-100 text-amber-600",
  lunch: "bg-forest-100 text-forest-600",
  snacks: "bg-coral-100 text-coral-600",
  dinner: "bg-sand-100 text-sand-500",
};

export function MealIcon({ meal, className }: { meal: MealId; className?: string }) {
  const Icon = mealIcons[meal];
  return <Icon className={className} aria-hidden />;
}
