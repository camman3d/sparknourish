"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Armchair,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bike,
  Check,
  ChevronLeft,
  Dumbbell,
  Equal,
  Flame,
  Footprints,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  activityLevelOptions,
  fitnessGoalOptions,
  genderOptions,
  type ActivityLevel,
  type FitnessGoal,
  type Gender,
} from "../_lib/profile-options";
import { DEFAULT_WEEKLY_MOVE_GOAL, weeklyMoveGoalOptions } from "../_lib/movement";

const goalVisuals: Record<FitnessGoal, { Icon: LucideIcon; tint: string }> = {
  lose: { Icon: ArrowDown, tint: "bg-lagoon-100 text-lagoon-600" },
  maintain: { Icon: Equal, tint: "bg-forest-100 text-forest-600" },
  build: { Icon: ArrowUp, tint: "bg-coral-100 text-coral-600" },
};

const activityVisuals: Record<ActivityLevel, { Icon: LucideIcon; description: string }> = {
  sedentary: { Icon: Armchair, description: "Little or no exercise" },
  light: { Icon: Footprints, description: "Light exercise 1–3 days a week" },
  moderate: { Icon: Dumbbell, description: "Moderate exercise 3–5 days a week" },
  active: { Icon: Bike, description: "Hard exercise 6–7 days a week" },
  very_active: { Icon: Flame, description: "Very hard exercise or a physical job" },
};

const inputClass =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-sand-600";

function chipClass(selected: boolean) {
  return `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    selected ? "bg-forest-700 text-white" : "bg-sand-100 text-sand-600 hover:bg-sand-200"
  }`;
}

const TOTAL_STEPS = 5;

export function OnboardingFlow({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [goal, setGoal] = useState<FitnessGoal>("maintain");
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [weeklyMoveGoal, setWeeklyMoveGoal] = useState(DEFAULT_WEEKLY_MOVE_GOAL);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateStep(current: number): string | null {
    if (current === 1 && !goal) return "Pick a goal to continue.";
    if (current === 2) {
      if (!gender) return "Select a gender.";
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120) return "Enter an age between 13 and 120.";
      const weight = Number(weightLbs);
      if (!(weight >= 50 && weight <= 700)) return "Enter a weight between 50 and 700 lbs.";
      const feet = Number(heightFeet);
      if (!Number.isInteger(feet) || feet < 3 || feet > 8) return "Enter a height between 3 and 8 feet.";
      const inches = Number(heightInches || 0);
      if (!Number.isInteger(inches) || inches < 0 || inches > 11) return "Inches must be between 0 and 11.";
    }
    if (current === 3 && !activityLevel) return "Select an activity level.";
    return null;
  }

  function handleContinue() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    void submit(false);
  }

  async function submit(skip: boolean) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skip,
        goal,
        gender: gender ?? undefined,
        age: age ? Number(age) : undefined,
        weightLbs: weightLbs ? Number(weightLbs) : undefined,
        heightFeet: heightFeet ? Number(heightFeet) : undefined,
        heightInches: heightInches ? Number(heightInches) : undefined,
        activityLevel: activityLevel ?? undefined,
        weeklyMoveGoalMin: weeklyMoveGoal,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const progress = (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-8 rounded-full transition-colors ${
            i <= step ? "bg-forest-700" : "bg-sand-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(step - 1);
            }}
            aria-label="Back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}

        {progress}

        <button
          type="button"
          onClick={() => submit(true)}
          disabled={submitting}
          className="shrink-0 text-sm font-semibold text-sand-500 transition-colors hover:text-forest-700 disabled:opacity-60"
        >
          Skip
        </button>
      </header>

      <div className="flex-1 pt-8">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-forest-100">
              <LeafBig />
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-forest-900">
              Let&apos;s build your plan, {firstName}
            </h1>
            <p className="text-base text-sand-600">
              A few quick questions and we&apos;ll set your daily calories and macros. You can change them
              any time.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-forest-100">
              <LeafBig />
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-forest-900">
                What are you aiming for, {firstName}?
              </h1>
              <p className="mt-2 text-base text-sand-600">
                We&apos;ll set your daily calories and macros from this. You can change it any time.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {fitnessGoalOptions.map((option) => {
                const selected = goal === option.id;
                const { Icon, tint } = goalVisuals[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGoal(option.id)}
                    className={`card flex items-center gap-4 p-4 text-left transition-colors ${
                      selected ? "border-2 border-forest-700" : "border-2 border-transparent"
                    }`}
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-tile ${tint}`}>
                      <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-bold text-forest-900">
                        {option.name}
                      </span>
                      <span className="block text-sm text-sand-500">{option.description}</span>
                    </span>
                    {selected ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                      </span>
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-full border-2 border-sand-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-forest-900">
                A little about you
              </h1>
              <p className="mt-2 text-base text-sand-600">
                We use this to estimate your daily energy needs.
              </p>
            </div>

            <div className="card flex flex-col gap-4 p-5">
              <div>
                <span className={labelClass}>Gender</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {genderOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setGender(option.id)}
                      className={chipClass(gender === option.id)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="age" className={labelClass}>Age</label>
                  <input
                    id="age"
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={inputClass}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className={labelClass}>Weight (lbs)</label>
                  <input
                    id="weight"
                    type="number"
                    min={50}
                    max={700}
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    className={inputClass}
                    placeholder="150"
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>Height</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className={inputClass}
                    placeholder="ft"
                    aria-label="Height (feet)"
                  />
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className={inputClass}
                    placeholder="in"
                    aria-label="Height (inches)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-forest-900">
                How active are you?
              </h1>
              <p className="mt-2 text-base text-sand-600">
                Think about a typical week, including work and exercise.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {activityLevelOptions.map((option) => {
                const selected = activityLevel === option.id;
                const { Icon, description } = activityVisuals[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActivityLevel(option.id)}
                    className={`card flex items-center gap-4 p-4 text-left transition-colors ${
                      selected ? "border-2 border-forest-700" : "border-2 border-transparent"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-forest-100 text-forest-600">
                      <Icon className="h-5.5 w-5.5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-bold text-forest-900">
                        {option.name}
                      </span>
                      <span className="block text-sm text-sand-500">{description}</span>
                    </span>
                    {selected ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                      </span>
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-full border-2 border-sand-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-plum-600 text-white">
              <Activity className="h-7 w-7" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-forest-900">
                How much do you want to move?
              </h1>
              <p className="mt-2 text-base text-sand-600">
                Pick a weekly goal. You log it yourself in a few taps, with no watch or sensors needed.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {weeklyMoveGoalOptions.map((option) => {
                const selected = weeklyMoveGoal === option.minutes;
                return (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => setWeeklyMoveGoal(option.minutes)}
                    className={`card flex items-center gap-3 p-4 text-left transition-colors ${
                      selected ? "border-2 border-plum-600" : "border-2 border-transparent"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-forest-900">
                          {option.name}
                        </span>
                        {option.suggested && (
                          <span className="rounded-full bg-plum-100 px-2.5 py-0.5 text-xs font-semibold text-plum-700">
                            Suggested
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-sand-500">{option.description}</span>
                    </span>
                    {selected ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-600 text-white">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                      </span>
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-full border-2 border-sand-300" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setWeeklyMoveGoal(0)}
                className={`mx-auto mt-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  weeklyMoveGoal === 0
                    ? "bg-plum-100 text-plum-700"
                    : "text-sand-600 hover:text-forest-800"
                }`}
              >
                No movement goal, I&apos;ll just track food
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-6">
        {error && <p className="text-sm font-medium text-coral-700">{error}</p>}
        <button
          type="button"
          onClick={handleContinue}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-4 text-base font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden />
              Setting up…
            </>
          ) : (
            <>
              {step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
              <ArrowRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** The design's simple leaf glyph inside the forest badge. */
function LeafBig() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M4 20c0-8 6-14 16-16 0 10-6 16-14 16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20c4-2 7-5 9-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
