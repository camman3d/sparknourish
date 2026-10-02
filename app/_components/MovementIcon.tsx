import {
  Accessibility,
  Bike,
  Dumbbell,
  Ellipsis,
  Footprints,
  PersonStanding,
  type LucideIcon,
} from "lucide-react";
import type { MovementType } from "../_lib/movement";

export const movementIcons: Record<MovementType, LucideIcon> = {
  walk: Footprints,
  run: PersonStanding,
  bike: Bike,
  strength: Dumbbell,
  yoga: Accessibility,
  other: Ellipsis,
};

/** Background + foreground tint for movement icon badges. */
export const movementTint = "bg-plum-100 text-plum-600";

export function MovementIcon({
  activity,
  className,
}: {
  activity: MovementType;
  className?: string;
}) {
  const Icon = movementIcons[activity];
  return <Icon className={className} strokeWidth={1.9} aria-hidden />;
}
