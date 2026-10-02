import { Droplet, Plus } from "lucide-react";

/**
 * Water tracking UI from the Home design.
 *
 * NOTE: water intake is not persisted anywhere yet — there is no column in the
 * schema and no endpoint. This is intentionally a no-op placeholder: the + and
 * tick marks render for design fidelity but do not record anything. See
 * PROJECT_STATUS.md → "Design no-ops".
 */
export function WaterTracker({ goalOz = 80 }: { goalOz?: number }) {
  const consumedOz = 0;
  const ticks = 8;
  const filled = Math.round((consumedOz / goalOz) * ticks);

  return (
    <section className="card flex items-center gap-4 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-600">
        <Droplet className="h-5.5 w-5.5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-sand-500">Water</p>
        <p className="font-display text-xl font-bold tabular-nums text-forest-900">
          {consumedOz} oz
          <span className="text-sm font-medium text-sand-500"> of {goalOz}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: ticks }).map((_, i) => (
          <span
            key={i}
            className={`h-8 w-1.5 rounded-full ${i < filled ? "bg-lagoon-500" : "bg-lagoon-200"}`}
          />
        ))}
      </div>

      <button
        type="button"
        title="Water logging is coming soon"
        aria-label="Log water (coming soon)"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700 transition-colors hover:bg-lagoon-200"
      >
        <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>
    </section>
  );
}
