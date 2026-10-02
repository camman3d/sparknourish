"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, X } from "lucide-react";
import { MovementIcon } from "../../_components/MovementIcon";
import { ProgressRing } from "../../_components/ProgressRing";
import {
  estimateCalories,
  formatClock,
  movementOption,
  timerMessage,
  type MovementType,
} from "../../_lib/movement";

export function MovementTimer({
  activity,
  targetMin,
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
          <span className="flex items-center gap-2 rounded-full bg-plum-100 px-4 py-2 text-sm font-semibold text-plum-700">
            <MovementIcon activity={activity} className="h-4 w-4" />
            {option.gerund}
          </span>
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
          <span className="mt-2 text-sm text-sand-500">of {targetMin}:00 target</span>
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
    </div>
  );
}
