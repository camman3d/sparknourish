const SEGMENTS = [
  { key: "protein", label: "Protein", color: "bg-forest-700" },
  { key: "carbs", label: "Carbs", color: "bg-coral-600" },
  { key: "fat", label: "Fat", color: "bg-amber-500" },
] as const;

export function MacroSplit({ split }: { split: { protein: number; carbs: number; fat: number } }) {
  return (
    <section className="card p-5">
      <h3 className="mb-4 font-display text-lg font-bold text-forest-900">Macro split</h3>

      <div className="flex h-7 gap-1.5">
        {SEGMENTS.map((segment) => (
          <div
            key={segment.key}
            className={`rounded-full ${segment.color}`}
            style={{ width: `${split[segment.key]}%` }}
          />
        ))}
      </div>

      <ul className="mt-4 flex items-center justify-between gap-2 text-sm">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.color}`} aria-hidden />
            <span className="text-sand-600">{segment.label}</span>
            <span className="font-semibold tabular-nums text-forest-900">{split[segment.key]}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
