import type { ReactNode } from "react";

/**
 * Generic donut ring. `CalorieRing` is the forest-coloured day-budget variant;
 * this one takes explicit colours so movement screens can render plum.
 */
export function ProgressRing({
  pct,
  size = 120,
  stroke = 12,
  trackColor = "var(--color-forest-100)",
  progressColor = "var(--color-forest-700)",
  className,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  progressColor?: string;
  className?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
