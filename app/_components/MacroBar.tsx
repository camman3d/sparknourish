const COLORS = {
  protein: "bg-forest-700",
  carbs: "bg-coral-600",
  fat: "bg-amber-500",
};

function formatGrams(grams: number) {
  return `${Math.round(grams * 10) / 10}`;
}

export function MacroBar({
  label,
  grams,
  goalGrams,
  kind,
}: {
  label: string;
  grams: number;
  goalGrams?: number;
  kind: keyof typeof COLORS;
}) {
  const pct = goalGrams ? Math.min(100, Math.round((grams / goalGrams) * 100)) : 100;

  return (
    <div>
      <p className="text-sm text-sand-500">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-forest-900">
        {formatGrams(grams)}g
        {goalGrams ? (
          <span className="text-sm font-medium text-sand-400"> / {goalGrams}g</span>
        ) : null}
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={`h-full rounded-full ${COLORS[kind]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
