"use client";

import { useMemo, useState } from "react";
import { foodDatabase, mealOptions, type FoodEntry, type MealId } from "../_lib/mock-data";

export function FoodSearch({ initialMeal }: { initialMeal: MealId }) {
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [added, setAdded] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foodDatabase;
    return foodDatabase.filter((food) => food.name.toLowerCase().includes(q));
  }, [query]);

  async function handleAdd(food: FoodEntry) {
    setAddingId(food.id);
    setError(null);

    const res = await fetch("/api/food-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealType: meal,
        name: food.name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      }),
    });

    setAddingId(null);
    if (!res.ok) {
      setError(`Couldn't add ${food.name}. Try again.`);
      return;
    }
    setAdded((prev) => [...prev, food.id]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add to
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mealOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMeal(option.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                meal === option.id
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search foods..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {error && (
        <p className="text-sm font-medium" style={{ color: "#d03b3b" }}>
          {error}
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {query ? `Results for "${query}"` : "Frequent foods"}
        </p>
        <ul className="flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {results.map((food) => {
            const isAdded = added.includes(food.id);
            return (
              <li key={food.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{food.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {food.quantity} · {food.calories} kcal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(food)}
                  disabled={isAdded || addingId === food.id}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-medium transition-colors ${
                    isAdded
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  }`}
                  aria-label={isAdded ? `${food.name} added` : `Add ${food.name}`}
                >
                  {isAdded ? "✓" : "+"}
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No foods found. Try a different search.
            </li>
          )}
        </ul>
      </div>

      <button
        type="button"
        className="rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Create custom food
      </button>
    </div>
  );
}
