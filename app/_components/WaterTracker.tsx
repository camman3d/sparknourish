"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Minus, Plus, X } from "lucide-react";

/** One tap of the + button logs one 8 oz glass. */
export const GLASS_OZ = 8;

/**
 * Water tile from the Home design. The tile's + logs a single glass directly;
 * tapping the "Water" label opens a modal for add/remove. Both write to
 * `water_log_entries` via `/api/water` with optimistic updates.
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
  const [managing, setManaging] = useState(false);

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
    <>
      <section className="tile flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-600">
              <Droplet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <button
              type="button"
              onClick={() => setManaging(true)}
              aria-haspopup="dialog"
              className="min-w-0 truncate rounded text-left text-sm font-medium text-forest-900 transition-colors hover:text-lagoon-700"
            >
              Water
            </button>
          </div>
          <button
            type="button"
            onClick={() => change(1)}
            disabled={pending}
            aria-label={`Log a glass of water (${GLASS_OZ} oz)`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700 transition-colors hover:bg-lagoon-200 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
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
        {error && !managing && <p className="mt-2 text-xs text-coral-600">{error}</p>}
      </section>

      {managing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Water"
            className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Water</h3>
              <button
                type="button"
                onClick={() => setManaging(false)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="rounded-tile bg-lagoon-50 p-4 text-center">
              <p className="font-display text-4xl font-bold tabular-nums text-forest-900">
                {optimisticOz}
                <span className="ml-1 text-base font-medium text-sand-500">oz</span>
              </p>
              <p className="mt-1 text-sm text-sand-500">of {goalOz} oz goal</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-lagoon-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    atGoal ? "bg-lagoon-600" : "bg-lagoon-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {error && <p className="mt-3 text-center text-sm font-medium text-coral-600">{error}</p>}

            <div className="mt-5 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => change(-1)}
                disabled={pending || optimisticOz <= 0}
                aria-label="Remove a glass of water"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700 transition-colors hover:bg-lagoon-200 disabled:opacity-40"
              >
                <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-sand-400">
                  One glass
                </p>
                <p className="font-display text-lg font-bold text-forest-900">{GLASS_OZ} oz</p>
              </div>
              <button
                type="button"
                onClick={() => change(1)}
                disabled={pending}
                aria-label={`Log a glass of water (${GLASS_OZ} oz)`}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700 transition-colors hover:bg-lagoon-200 disabled:opacity-40"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setManaging(false)}
              className="mt-5 w-full rounded-full bg-forest-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
