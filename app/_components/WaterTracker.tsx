"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Minus, Plus } from "lucide-react";

/** One tap of the + button logs one 8 oz glass. */
export const GLASS_OZ = 8;

/**
 * Water tile from the Home design. Logs glasses against `water_log_entries`
 * via `/api/water` and optimistically updates before the server round-trip.
 */
export function WaterTracker({
  consumedOz,
  goalOz,
  date,
}: {
  consumedOz: number;
  goalOz: number;
  date: string;
}) {
  const router = useRouter();
  const [optimisticOz, setOptimisticOz] = useState(consumedOz);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync when the server sends fresh totals (navigation or router.refresh()).
  // Adjusting state during render is the React-recommended alternative to an
  // effect here; it re-renders immediately without a cascading effect pass.
  const serverKey = `${date}:${consumedOz}`;
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (serverKey !== syncedKey) {
    setSyncedKey(serverKey);
    setOptimisticOz(consumedOz);
  }

  const pct = goalOz > 0 ? Math.min(100, Math.round((optimisticOz / goalOz) * 100)) : 0;
  const atGoal = goalOz > 0 && optimisticOz >= goalOz;

  async function change(delta: 1 | -1) {
    setError(null);
    setOptimisticOz((current) => Math.max(0, current + delta * GLASS_OZ));
    try {
      const res =
        delta > 0
          ? await fetch("/api/water", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amountOz: GLASS_OZ, date }),
            })
          : await fetch(`/api/water?date=${encodeURIComponent(date)}`, { method: "DELETE" });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save water.");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setOptimisticOz(consumedOz);
      setError(err instanceof Error ? err.message : "Could not save water.");
    }
  }

  return (
    <section className="tile flex flex-1 flex-col p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-600">
          <Droplet className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 font-medium text-forest-900">Water</p>
        <div className="flex shrink-0 items-center gap-0.5">
          {optimisticOz > 0 && (
            <button
              type="button"
              onClick={() => change(-1)}
              disabled={pending}
              aria-label="Remove a glass of water"
              className="flex h-8 w-8 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-200/60 hover:text-forest-700 disabled:opacity-50"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => change(1)}
            disabled={pending}
            aria-label={`Log a glass of water (${GLASS_OZ} oz)`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700 transition-colors hover:bg-lagoon-200 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>

      <p className="mt-3 font-display text-xl font-bold tabular-nums text-forest-900">
        {optimisticOz}
        <span className="text-base font-semibold"> oz</span>
        <span className="text-sm font-medium text-sand-500"> of {goalOz}</span>
      </p>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-lagoon-100">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            atGoal ? "bg-lagoon-600" : "bg-lagoon-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
    </section>
  );
}
