"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { movementOption, type MovementType } from "../../_lib/movement";

export function CompletionScreen({
  firstName,
  entry,
  week,
  remainingBase,
  remainingWith,
  addToBudget,
}: {
  firstName: string;
  entry: { id: number; activity: MovementType; durationMin: number; calories: number };
  week: { totalMinutes: number; goalMinutes: number; movedDays: number };
  remainingBase: number;
  remainingWith: number;
  addToBudget: boolean;
}) {
  const router = useRouter();
  const option = movementOption(entry.activity);

  const [add, setAdd] = useState(addToBudget);
  const [savingToggle, setSavingToggle] = useState(false);

  const weekPct =
    week.goalMinutes > 0
      ? Math.min(100, (week.totalMinutes / week.goalMinutes) * 100)
      : 0;
  const weekRemaining = week.goalMinutes > 0 ? Math.max(0, week.goalMinutes - week.totalMinutes) : 0;

  async function toggleAdd() {
    const next = !add;
    setAdd(next);
    setSavingToggle(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addExerciseToBudget: next }),
    });
    setSavingToggle(false);
    router.refresh();
  }

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[40px] bg-plum-100 px-5 pb-10 pt-16 text-center">
        <span className="absolute left-8 top-10 h-3 w-3 rounded-full bg-coral-500" aria-hidden />
        <span className="absolute left-16 top-20 h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        <span className="absolute right-12 top-8 h-2.5 w-2.5 rounded-full bg-lagoon-600" aria-hidden />
        <span className="absolute right-6 top-20 h-3 w-3 rounded-full bg-forest-700" aria-hidden />
        <span className="absolute right-24 top-6 h-2 w-2 rounded-full bg-plum-500" aria-hidden />

        <span className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-plum-600 text-white shadow-lg">
          <Check className="h-12 w-12" strokeWidth={3} aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-plum-900">
          Nice {option.past}, {firstName}
        </h1>
        <p className="mt-2 text-base text-sand-600">
          {entry.durationMin} min · about {entry.calories} kcal
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-4 px-5 pt-5">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-forest-900">This week</h2>
            <p className="text-sm font-semibold tabular-nums text-forest-900">
              {week.totalMinutes}
              <span className="font-medium text-sand-500">
                {week.goalMinutes > 0 ? ` / ${week.goalMinutes} min` : " min"}
              </span>
            </p>
          </div>
          {week.goalMinutes > 0 && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-plum-100">
              <div
                className="h-full rounded-full bg-plum-600"
                style={{ width: `${Math.max(weekPct, week.totalMinutes > 0 ? 4 : 0)}%` }}
              />
            </div>
          )}
          <p className="mt-3 text-sm text-sand-600">
            {week.goalMinutes > 0
              ? `${weekRemaining} minutes to go. You've moved ${week.movedDays} ${
                  week.movedDays === 1 ? "day" : "days"
                } this week.`
              : `You've moved ${week.movedDays} ${
                  week.movedDays === 1 ? "day" : "days"
                } this week.`}
          </p>
        </section>

        <section className="card flex items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-forest-900">
              Add {entry.calories} kcal to today&apos;s budget
            </p>
            <p className="mt-0.5 text-sm text-sand-600">
              {add
                ? `Remaining goes from ${remainingBase.toLocaleString()} to ${remainingWith.toLocaleString()}. Change this anytime in Profile.`
                : `Exercise isn't added to your budget. Turn it on to go from ${remainingBase.toLocaleString()} to ${remainingWith.toLocaleString()}. Change this anytime in Profile.`}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={add}
            aria-label="Add exercise calories to budget"
            onClick={toggleAdd}
            disabled={savingToggle}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              add ? "bg-forest-700" : "bg-sand-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                add ? "left-7" : "left-1"
              }`}
            />
          </button>
        </section>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-6">
        <button
          type="button"
          onClick={() => {
            router.push("/move");
            router.refresh();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-4 text-base font-semibold text-white transition-colors hover:bg-forest-800"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => router.push(`/move/log?edit=${entry.id}`)}
          className="mt-3 w-full text-center text-sm font-semibold text-sand-600 transition-colors hover:text-forest-800"
        >
          Edit details
        </button>
      </div>
    </>
  );
}
