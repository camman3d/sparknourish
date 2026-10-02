"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, Minus, Pause, Pencil, Play, Plus, X } from "lucide-react";
import { MovementIcon, movementIcons } from "../../_components/MovementIcon";
import { ProgressRing } from "../../_components/ProgressRing";
import {
  estimateCalories,
  formatClock,
  movementOption,
  movementOptions,
  timerMessage,
  type MovementType,
} from "../../_lib/movement";

const TARGET_CHIPS = [10, 20, 30, 45, 60];

export function MovementTimer({
  activity: initialActivity,
  targetMin: initialTargetMin,
  weightLbs,
  doneTodayMin,
  dayGoalMin,
}: {
  activity: MovementType;
  targetMin: number;
  weightLbs: number;
  doneTodayMin: number;
  dayGoalMin: number;
}) {
  const router = useRouter();

  const [activity, setActivity] = useState<MovementType>(initialActivity);
  const [targetMin, setTargetMin] = useState(initialTargetMin);
  const [activityOpen, setActivityOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const option = movementOption(activity);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseMsRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(baseMsRef.current + (Date.now() - startRef.current));
    }, 250);
    return () => clearInterval(interval);
  }, [running]);

  const elapsedSec = elapsedMs / 1000;
  const elapsedMin = elapsedSec / 60;
  const targetSec = targetMin * 60;
  const pct = targetSec > 0 ? (elapsedSec / targetSec) * 100 : 0;

  const calories = estimateCalories({
    activity,
    durationMin: elapsedMin,
    intensity: "moderate",
    weightLbs,
  });
  const remainingToGoal = dayGoalMin > 0
    ? Math.max(0, Math.ceil(dayGoalMin - doneTodayMin - elapsedMin))
    : 0;

  function stepTarget(delta: number) {
    setTargetMin((prev) => Math.max(1, Math.min(600, prev + delta)));
  }

  function toggleRunning() {
    if (running) {
      baseMsRef.current += Date.now() - startRef.current;
      setElapsedMs(baseMsRef.current);
      setRunning(false);
    } else {
      setRunning(true);
    }
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity,
        durationMin: Math.max(1, Math.round(elapsedMin)),
        intensity: "moderate",
      }),
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

  function handleClose() {
    if (elapsedSec > 5 && !window.confirm("Discard this activity?")) return;
    router.push("/move");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            aria-label="Change activity"
            className="flex items-center gap-2 rounded-full bg-plum-100 px-4 py-2 text-sm font-semibold text-plum-700 transition-colors hover:bg-plum-200"
          >
            <MovementIcon activity={activity} className="h-4 w-4" />
            {option.gerund}
            <ChevronDown className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
        <span className="h-11 w-11 shrink-0" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
        <ProgressRing
          pct={pct}
          size={264}
          stroke={20}
          trackColor="var(--color-plum-200)"
          progressColor="var(--color-plum-600)"
        >
          <span className="font-display text-6xl font-bold leading-none tabular-nums text-plum-800">
            {formatClock(elapsedSec)}
          </span>
          <button
            type="button"
            onClick={() => setTargetOpen(true)}
            aria-label="Change target time"
            className="mt-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-sm text-sand-500 transition-colors hover:bg-plum-100 hover:text-plum-700"
          >
            of {targetMin}:00 target
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>
        </ProgressRing>

        <div className="flex items-stretch gap-6 text-center">
          <div className="px-2">
            <p className="font-display text-3xl font-bold tabular-nums text-plum-800">≈ {calories}</p>
            <p className="mt-0.5 text-sm text-sand-500">kcal so far</p>
          </div>
          <span className="w-px bg-sand-300/70" aria-hidden />
          <div className="px-2">
            {dayGoalMin > 0 ? (
              <>
                <p className="font-display text-3xl font-bold tabular-nums text-plum-800">
                  {remainingToGoal} min
                </p>
                <p className="mt-0.5 text-sm text-sand-500">to hit today&apos;s goal</p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl font-bold tabular-nums text-plum-800">
                  {Math.floor(elapsedMin)} min
                </p>
                <p className="mt-0.5 text-sm text-sand-500">this session</p>
              </>
            )}
          </div>
        </div>

        <p className="max-w-xs text-center text-base text-sand-600">{timerMessage(pct)}</p>
      </div>

      <div className="mt-auto pt-6">
        {error && <p className="mb-3 text-center text-sm font-medium text-coral-700">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleRunning}
            aria-label={running ? "Pause" : "Resume"}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-plum-200 bg-white text-plum-700 transition-colors hover:bg-plum-100"
          >
            {running ? (
              <Pause className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            ) : (
              <Play className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-plum-600 py-4 text-base font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden />
                Saving…
              </>
            ) : (
              `Finish ${option.past}`
            )}
          </button>
        </div>
      </div>

      {/* Change activity */}
      {activityOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Change activity"
        >
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Change activity</h3>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {movementOptions.map((item) => {
                const Icon = movementIcons[item.id];
                const selected = activity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivity(item.id);
                      setActivityOpen(false);
                    }}
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
        </div>
      )}

      {/* Change target */}
      {targetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Change target time"
        >
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Target time</h3>
              <button
                type="button"
                onClick={() => setTargetOpen(false)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-sand-500">Move for</p>
                <p className="font-display text-3xl font-bold tabular-nums text-forest-900">
                  {targetMin}
                  <span className="ml-1 text-base font-medium text-sand-500">min</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepTarget(-5)}
                  aria-label="Decrease target"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-plum-100 text-plum-700 transition-colors hover:bg-plum-200"
                >
                  <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => stepTarget(5)}
                  aria-label="Increase target"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-plum-600 text-white transition-colors hover:bg-plum-700"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5">
              {TARGET_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTargetMin(chip)}
                  className={`h-12 flex-1 rounded-full text-sm font-semibold transition-colors ${
                    targetMin === chip
                      ? "bg-plum-600 text-white"
                      : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTargetOpen(false)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-plum-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-plum-700"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
