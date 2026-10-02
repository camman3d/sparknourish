"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, X } from "lucide-react";
import { movementIcons } from "../../_components/MovementIcon";
import {
  estimateCalories,
  movementIntensityOptions,
  movementOption,
  movementOptions,
  type MovementIntensity,
  type MovementType,
} from "../../_lib/movement";

const QUICK_PICKS: { activity: MovementType; durationMin: number }[] = [
  { activity: "walk", durationMin: 20 },
  { activity: "strength", durationMin: 30 },
];

const DURATION_CHIPS = [10, 20, 30, 45, 60];

export function LogActivityForm({
  weightLbs,
  editing,
}: {
  weightLbs: number;
  editing: {
    id: number;
    activity: MovementType;
    durationMin: number;
    intensity: MovementIntensity;
  } | null;
}) {
  const router = useRouter();

  const [activity, setActivity] = useState<MovementType>(editing?.activity ?? "walk");
  const [durationMin, setDurationMin] = useState(editing?.durationMin ?? 25);
  const [intensity, setIntensity] = useState<MovementIntensity>(editing?.intensity ?? "moderate");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const option = movementOption(activity);
  const calories = useMemo(
    () => estimateCalories({ activity, durationMin, intensity, weightLbs }),
    [activity, durationMin, intensity, weightLbs]
  );

  function stepDuration(delta: number) {
    setDurationMin((prev) => Math.max(1, Math.min(600, prev + delta)));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    const res = await fetch(editing ? `/api/movement/${editing.id}` : "/api/movement", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity, durationMin, intensity }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const entry = (await res.json()) as { id: number };
    router.push(`/move/complete?entry=${entry.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-forest-900">
          {editing ? "Edit activity" : "Log activity"}
        </h1>
        <Link
          href="/move"
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-5 pt-5">
        {/* Quick picks */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick.activity}
              type="button"
              onClick={() => {
                setActivity(pick.activity);
                setDurationMin(pick.durationMin);
              }}
              className="whitespace-nowrap rounded-full bg-plum-100 px-4 py-2 text-sm font-semibold text-plum-700 transition-colors hover:bg-plum-200"
            >
              {movementOption(pick.activity).name} · {pick.durationMin} min
            </button>
          ))}
        </div>

        {/* Activity grid */}
        <div>
          <h2 className="font-display text-lg font-bold text-forest-900">What did you do?</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {movementOptions.map((item) => {
              const Icon = movementIcons[item.id];
              const selected = activity === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivity(item.id)}
                  aria-pressed={selected}
                  className={`card flex flex-col items-center gap-2 p-4 transition-colors ${
                    selected
                      ? "border-2 border-plum-600 text-plum-700"
                      : "border-2 border-transparent text-forest-900"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                  <span className="text-sm font-semibold">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-sand-500">Duration</p>
              <p className="font-display text-3xl font-bold tabular-nums text-forest-900">
                {durationMin}
                <span className="ml-1 text-base font-medium text-sand-500">min</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepDuration(-5)}
                aria-label="Decrease duration"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-plum-100 text-plum-700 transition-colors hover:bg-plum-200"
              >
                <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => stepDuration(5)}
                aria-label="Increase duration"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-plum-600 text-white transition-colors hover:bg-plum-700"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5">
            {DURATION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDurationMin(chip)}
                className={`h-12 flex-1 rounded-full text-sm font-semibold transition-colors ${
                  durationMin === chip
                    ? "bg-plum-600 text-white"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* Intensity */}
        <div className="flex rounded-full bg-sand-200/80 p-1">
          {movementIntensityOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIntensity(item.id)}
              className={`flex-1 rounded-full py-2.5 text-sm transition-colors ${
                intensity === item.id
                  ? "bg-white font-semibold text-forest-900 shadow-sm"
                  : "font-medium text-sand-600 hover:text-forest-800"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Estimate */}
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl font-bold text-plum-700">≈ {calories} kcal</p>
          <p className="text-sm text-sand-500">A rough estimate is plenty. No devices needed.</p>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-5">
        {error && <p className="mb-3 text-sm font-medium text-coral-700">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-coral-600 py-4 text-base font-semibold text-white transition-colors hover:bg-coral-700 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              {editing
                ? "Save activity"
                : activity === "other"
                  ? "Log activity"
                  : `Log ${option.name.toLowerCase()}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
