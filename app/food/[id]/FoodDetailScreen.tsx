"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Loader2, Minus, Plus, Star } from "lucide-react";
import { CalorieRing } from "../../_components/CalorieRing";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import {
  convertServing,
  formatServingAmount,
  parseServing,
  servingMultiplier,
  servingNoun,
  type ServingUnit,
} from "../../_lib/serving";

type FoodDetailData = {
  id: string;
  source: "custom" | "usda";
  name: string;
  subtitle: string | null;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

function MacroColumn({
  label,
  grams,
  goalGrams,
  color,
}: {
  label: string;
  grams: number;
  goalGrams: number;
  color: string;
}) {
  const pct = goalGrams > 0 ? Math.min(100, Math.round((grams / goalGrams) * 100)) : 0;
  return (
    <div>
      <p className="text-sm text-sand-500">{label}</p>
      <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-forest-900">
        {Math.round(grams)}g
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FoodDetailScreen({
  food,
  dailyGoal,
  proteinGoal,
  carbsGoal,
  fatGoal,
  meal,
  date,
}: {
  food: FoodDetailData;
  dailyGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  meal: MealId;
  date: string;
}) {
  const router = useRouter();
  const parsed = useMemo(() => parseServing(food.servingSize), [food.servingSize]);

  const [unit, setUnit] = useState<ServingUnit>(() =>
    parseServing(food.servingSize).grams ? "g" : "serving"
  );
  const [amount, setAmount] = useState<number>(() => parseServing(food.servingSize).grams ?? 1);
  const [favorite, setFavorite] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const multiplier = servingMultiplier(unit, amount, parsed.grams);
  const calories = Math.round(food.calories * multiplier);
  const protein = food.proteinG * multiplier;
  const carbs = food.carbsG * multiplier;
  const fat = food.fatG * multiplier;

  const pct = Math.min(100, Math.round((calories / Math.max(1, dailyGoal)) * 100));
  const mealName = mealOptions.find((option) => option.id === meal)?.name ?? "Meal";

  function stepBy(direction: 1 | -1) {
    setAmount((prev) => {
      const step = unit === "g" ? 10 : 1;
      const min = unit === "serving" ? 1 : unit === "g" ? 1 : 0.5;
      const next = prev + direction * step;
      return Math.max(min, Math.round(next * 10) / 10);
    });
  }

  function selectUnit(next: ServingUnit) {
    if (next === unit) return;
    const converted = convertServing(unit, amount, next, parsed.grams);
    setUnit(next);
    setAmount(next === "g" ? Math.max(1, Math.round(converted)) : Math.max(0.5, round1(converted)));
  }

  const quantity =
    unit === "serving"
      ? amount === 1
        ? parsed.label
        : `${formatServingAmount("serving", amount, parsed.grams)} × ${parsed.label}`
      : unit === "g"
        ? `${Math.round(amount)} g`
        : `${formatServingAmount("oz", amount, parsed.grams)} oz`;

  async function handleAdd() {
    setAdding(true);
    setError(null);
    const res = await fetch("/api/food-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealType: meal,
        name: food.name,
        quantity,
        calories,
        protein: round1(protein),
        carbs: round1(carbs),
        fat: round1(fat),
        date,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add this food. Please try again.");
      setAdding(false);
      return;
    }

    setAdded(true);
    router.push(`/?date=${date}`);
    router.refresh();
  }

  const unitLabel =
    unit === "g" ? "g" : unit === "oz" ? "oz" : servingNoun(parsed.label);

  const nutrientRows = [
    { label: "Fiber", value: `${round1(food.fiberG * multiplier)} g` },
    { label: "Sugar", value: `${round1(food.sugarG * multiplier)} g` },
    { label: "Sodium", value: `${Math.round(food.sodiumMg * multiplier)} mg` },
    { label: "Cholesterol", value: `${Math.round(food.cholesterolMg * multiplier)} mg` },
  ];

  return (
    <main className="flex flex-col gap-5 px-5 pb-32 pt-8">
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-3xl font-bold leading-tight text-forest-900">
            {food.name}
          </h1>
          {food.subtitle && <p className="mt-1 text-sm text-sand-500">{food.subtitle}</p>}
        </div>

        <button
          type="button"
          onClick={() => setFavorite((prev) => !prev)}
          aria-label={favorite ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={favorite}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <Star
            className={`h-5 w-5 ${favorite ? "fill-amber-400 text-amber-500" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </header>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-sand-500">Serving size</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold tabular-nums text-forest-900">
                {formatServingAmount(unit, amount, parsed.grams)}
              </span>
              <span className="text-lg font-medium text-sand-500">{unitLabel}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => stepBy(-1)}
              aria-label="Decrease serving"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-100 text-forest-700 transition-colors hover:bg-forest-200"
            >
              <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => stepBy(1)}
              aria-label="Increase serving"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-700 text-white transition-colors hover:bg-forest-800"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {parsed.grams && (
            <>
              <UnitPill label="Grams" selected={unit === "g"} onClick={() => selectUnit("g")} />
              <UnitPill label="Ounces" selected={unit === "oz"} onClick={() => selectUnit("oz")} />
            </>
          )}
          <UnitPill
            label={parsed.label}
            selected={unit === "serving"}
            onClick={() => selectUnit("serving")}
          />
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-4">
          <CalorieRing pct={pct} size={104} stroke={11} />
          <div className="min-w-0 text-right">
            <p className="font-display text-4xl font-bold tabular-nums leading-none text-forest-900">
              {calories}
              <span className="ml-1 text-base font-medium text-sand-500">kcal</span>
            </p>
            <p className="mt-2 text-sm text-sand-500">
              of your {dailyGoal.toLocaleString()} daily goal
            </p>
          </div>
        </div>

        <hr className="my-5 border-sand-200" />

        <div className="grid grid-cols-3 gap-4">
          <MacroColumn label="Protein" grams={protein} goalGrams={proteinGoal} color="bg-forest-700" />
          <MacroColumn label="Carbs" grams={carbs} goalGrams={carbsGoal} color="bg-coral-600" />
          <MacroColumn label="Fat" grams={fat} goalGrams={fatGoal} color="bg-amber-500" />
        </div>
      </section>

      <section className="card divide-y divide-sand-100 px-5">
        {nutrientRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3.5">
            <span className="text-sm text-sand-600">{row.label}</span>
            <span className="font-semibold tabular-nums text-forest-900">{row.value}</span>
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-sand-100/95 px-5 pb-6 pt-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          {error && <p className="mb-2 text-center text-sm font-medium text-coral-700">{error}</p>}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || added}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-coral-600 py-4 text-base font-semibold text-white transition-colors hover:bg-coral-700 disabled:opacity-70"
          >
            {adding ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden />
                Adding…
              </>
            ) : added ? (
              <>
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                Added
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                Add to {mealName}
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function UnitPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
        selected
          ? "bg-forest-100 text-forest-800"
          : "bg-sand-100 text-sand-500 hover:bg-sand-200"
      }`}
    >
      {label}
    </button>
  );
}
