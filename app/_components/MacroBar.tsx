const COLORS = {
  protein: "bg-sky-500",
  carbs: "bg-amber-500",
  fat: "bg-violet-500",
};

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
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {grams}g{goalGrams ? ` / ${goalGrams}g` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${COLORS[kind]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
