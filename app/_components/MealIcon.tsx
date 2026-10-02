import { Coffee, Cookie, Sandwich, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { MealId } from "../_lib/mock-data";

export const mealIcons: Record<MealId, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: UtensilsCrossed,
  snacks: Cookie,
};

export function MealIcon({ meal, className }: { meal: MealId; className?: string }) {
  const Icon = mealIcons[meal];
  return <Icon className={className} aria-hidden />;
}
