"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { MealIcon } from "../_components/MealIcon";
import { mealOptions, type MealId } from "../_lib/mock-data";
import type { CustomFood, UsdaFood } from "../../db/schema";

type UnifiedFood = {
  id: string;
  source: "custom" | "usda" | "mock";
  name: string;
  servingSize: string;
  brandOwner?: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type ParsedAiItem = {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export function FoodSearch({ initialMeal }: { initialMeal: MealId }) {
  const router = useRouter();
  const [mode, setMode] = useState<"search" | "ai">("search");
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [results, setResults] = useState<UnifiedFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Portion adjuster state for clicked food
  const [selectedFood, setSelectedFood] = useState<UnifiedFood | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);

  // Custom food modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customServing, setCustomServing] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [estimatingCustom, setEstimatingCustom] = useState(false);
  const [customEstimateError, setCustomEstimateError] = useState<string | null>(null);
  const [customEstimateMissingKey, setCustomEstimateMissingKey] = useState(false);

  // AI Meal Logging state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMissingKey, setAiMissingKey] = useState(false);
  const [aiParsedItems, setAiParsedItems] = useState<ParsedAiItem[]>([]);
  const [aiLogging, setAiLogging] = useState(false);
  const [, startTransition] = useTransition();

  // Search effect with debounce
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error("Search failed");
        const data: { custom: CustomFood[]; usda: UsdaFood[] } = await res.json();
        if (!active) return;

        const unified: UnifiedFood[] = [
          ...(data.custom || []).map((c) => ({
            id: `custom-${c.id}`,
            source: "custom" as const,
            name: c.name,
            servingSize: c.servingSize,
            calories: c.calories,
            proteinG: c.proteinG,
            carbsG: c.carbsG,
            fatG: c.fatG,
          })),
          ...(data.usda || []).map((u) => ({
            id: `usda-${u.fdcId}`,
            source: "usda" as const,
            name: u.name,
            servingSize: u.servingSize,
            brandOwner: u.brandOwner,
            calories: u.calories,
            proteinG: u.proteinG,
            carbsG: u.carbsG,
            fatG: u.fatG,
          })),
        ];

        setResults(unified);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  async function handleLogFood(food: UnifiedFood, multiplier = 1) {
    setAddingId(food.id);
    setError(null);

    const adjustedCalories = Math.round(food.calories * multiplier);
    const adjustedProtein = Math.round(food.proteinG * multiplier * 10) / 10;
    const adjustedCarbs = Math.round(food.carbsG * multiplier * 10) / 10;
    const adjustedFat = Math.round(food.fatG * multiplier * 10) / 10;
    const adjustedQuantity =
      multiplier === 1 ? food.servingSize : `${multiplier}x (${food.servingSize})`;

    const res = await fetch("/api/food-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealType: meal,
        name: food.name,
        quantity: adjustedQuantity,
        calories: adjustedCalories,
        protein: adjustedProtein,
        carbs: adjustedCarbs,
        fat: adjustedFat,
      }),
    });

    setAddingId(null);
    if (!res.ok) {
      setError(`Couldn't add ${food.name}. Try again.`);
      return;
    }

    setAdded((prev) => [...prev, food.id]);
    setSelectedFood(null);
    setServingsMultiplier(1);
  }

  async function handleCreateCustomFood(e: React.FormEvent) {
    e.preventDefault();
    setSavingCustom(true);
    setCustomError(null);

    const res = await fetch("/api/custom-foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customName,
        servingSize: customServing,
        calories: Number(customCalories),
        protein: Number(customProtein || 0),
        carbs: Number(customCarbs || 0),
        fat: Number(customFat || 0),
      }),
    });

    setSavingCustom(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCustomError(data.error || "Failed to create custom food.");
      return;
    }

    const created: CustomFood = await res.json();
    const newFood: UnifiedFood = {
      id: `custom-${created.id}`,
      source: "custom",
      name: created.name,
      servingSize: created.servingSize,
      calories: created.calories,
      proteinG: created.proteinG,
      carbsG: created.carbsG,
      fatG: created.fatG,
    };

    setResults((prev) => [newFood, ...prev]);
    setShowCustomModal(false);
    setCustomName("");
    setCustomServing("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");

    // Auto-prompt portion log for the newly created food
    setSelectedFood(newFood);
  }

  async function handleEstimateCustomNutrition() {
    if (!customName.trim() || estimatingCustom) return;

    setEstimatingCustom(true);
    setCustomEstimateError(null);
    setCustomEstimateMissingKey(false);

    const res = await fetch("/api/ai/estimate-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customName,
        servingSize: customServing,
      }),
    });

    setEstimatingCustom(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setCustomEstimateError(data.error || "Failed to estimate nutrition with AI.");
      if (data.missingApiKey) setCustomEstimateMissingKey(true);
      return;
    }

    if (data.calories != null) setCustomCalories(String(data.calories));
    if (data.proteinG != null) setCustomProtein(String(data.proteinG));
    if (data.carbsG != null) setCustomCarbs(String(data.carbsG));
    if (data.fatG != null) setCustomFat(String(data.fatG));
    if (data.servingSize && !customServing.trim()) setCustomServing(data.servingSize);
  }

  async function handleAiParse(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiMissingKey(false);
    setAiParsedItems([]);

    const res = await fetch("/api/ai/parse-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: aiPrompt,
        defaultMealType: meal,
      }),
    });

    setAiLoading(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setAiError(data.error || "Failed to parse meal with AI.");
      if (data.missingApiKey) setAiMissingKey(true);
      return;
    }

    if (data.mealType) setMeal(data.mealType);
    setAiParsedItems(data.items || []);
  }

  async function handleAiLogAll() {
    setAiLogging(true);
    setAiError(null);

    let failed = false;
    for (const item of aiParsedItems) {
      const res = await fetch("/api/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: meal,
          name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.proteinG,
          carbs: item.carbsG,
          fat: item.fatG,
        }),
      });
      if (!res.ok) failed = true;
    }

    setAiLogging(false);
    if (failed) {
      setAiError("Some items could not be logged. Please try again.");
      return;
    }

    startTransition(() => {
      router.push(`/meals/${meal}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
            mode === "search"
              ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
          Search Foods
        </button>

        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
            mode === "ai"
              ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
          AI Natural Log
        </button>
      </div>

      {/* Meal Selection Chips */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Target meal
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mealOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMeal(option.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                meal === option.id
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <MealIcon meal={option.id} className="h-3.5 w-3.5" />
              {option.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mode A: Food Search */}
      {mode === "search" && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search USDA database & custom foods..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm font-medium" style={{ color: "#d03b3b" }}>
              {error}
            </p>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {searching
                  ? "Searching..."
                  : query
                  ? `Results for "${query}"`
                  : "Frequent & custom foods"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCustomEstimateError(null);
                  setCustomEstimateMissingKey(false);
                  setShowCustomModal(true);
                }}
                className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                New custom food
              </button>
            </div>

            <ul className="flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {results.map((food) => {
                const isAdded = added.includes(food.id);
                return (
                  <li
                    key={food.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedFood(food);
                        setServingsMultiplier(1);
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                          {food.name}
                        </p>
                        {food.source === "custom" && (
                          <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Custom
                          </span>
                        )}
                        {food.brandOwner && (
                          <span className="shrink-0 truncate text-[10px] text-zinc-400">
                            · {food.brandOwner}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {food.servingSize} · P {food.proteinG}g · C {food.carbsG}g · F {food.fatG}g
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {food.calories} <span className="text-xs font-normal text-zinc-400">kcal</span>
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFood(food);
                          setServingsMultiplier(1);
                        }}
                        disabled={isAdded || addingId === food.id}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        }`}
                        aria-label={isAdded ? `${food.name} added` : `Add ${food.name}`}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                        ) : (
                          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}

              {!searching && results.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {query
                    ? "No foods found matching your search. Create it as a custom food below!"
                    : "No foods found. Type to search or create a custom food."}
                </li>
              )}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomEstimateError(null);
              setCustomEstimateMissingKey(false);
              setShowCustomModal(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Create custom food
          </button>

          <Link
            href={`/meals/${meal}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Done adding
          </Link>
        </div>
      )}

      {/* Mode B: AI Natural Language Logging */}
      {mode === "ai" && (
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleAiParse}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Describe your meal
              </label>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Mention ingredients, portion sizes, or restaurant meals.
              </p>
              <textarea
                rows={3}
                required
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 2 scrambled eggs, 2 slices turkey bacon, 1 piece sourdough toast with butter, and a cup of black coffee"
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            {aiError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <p className="font-medium">{aiError}</p>
                {aiMissingKey && (
                  <Link
                    href="/profile"
                    className="mt-1.5 inline-block font-semibold underline hover:text-red-800 dark:hover:text-red-300"
                  >
                    Open Profile Settings to add API Key →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  Parse Meal with AI
                </>
              )}
            </button>
          </form>

          {/* AI Parsed Results Review */}
          {aiParsedItems.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Estimated Items ({aiParsedItems.length})
                </h3>
                <span className="text-xs text-zinc-500">
                  {aiParsedItems.reduce((s, i) => s + i.calories, 0)} kcal total
                </span>
              </div>

              <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                {aiParsedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.quantity} · P {item.proteinG}g · C {item.carbsG}g · F {item.fatG}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {item.calories} <span className="text-xs font-normal text-zinc-400">kcal</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAiParsedItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-zinc-400 hover:text-red-500"
                        title="Remove item"
                      >
                        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAiLogAll}
                disabled={aiLogging}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {aiLogging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                    Logging items...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    Log all {aiParsedItems.length} items to {meal}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Portion Multiplier Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedFood.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Base portion: {selectedFood.servingSize}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="my-4 rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.round(selectedFood.calories * servingsMultiplier)}{" "}
                <span className="text-sm font-normal text-zinc-400">kcal</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                P {Math.round(selectedFood.proteinG * servingsMultiplier * 10) / 10}g · C{" "}
                {Math.round(selectedFood.carbsG * servingsMultiplier * 10) / 10}g · F{" "}
                {Math.round(selectedFood.fatG * servingsMultiplier * 10) / 10}g
              </p>
            </div>

            <div>
              <label className={labelClass}>Number of servings</label>
              <div className="mb-3 flex items-center gap-2">
                {[0.5, 1, 1.5, 2].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setServingsMultiplier(num)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      servingsMultiplier === num
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={servingsMultiplier}
                  onChange={(e) => setServingsMultiplier(Math.max(0.1, Number(e.target.value) || 1))}
                  className={inputClass}
                />
                <span className="text-xs text-zinc-400">servings</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="w-1/3 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleLogFood(selectedFood, servingsMultiplier)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Add to {meal}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Food Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Create Custom Food
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFood} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Food Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandma's Protein Cookie"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Serving Size *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 cookie (55g), 1 scoop (30g)"
                  value={customServing}
                  onChange={(e) => setCustomServing(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={handleEstimateCustomNutrition}
                disabled={estimatingCustom || !customName.trim()}
                title={!customName.trim() ? "Enter a food name first" : undefined}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                {estimatingCustom ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                    Estimating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    Estimate nutrition from name
                  </>
                )}
              </button>

              {customEstimateError && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <p className="font-medium">{customEstimateError}</p>
                  {customEstimateMissingKey && (
                    <Link
                      href="/profile"
                      className="mt-1 inline-block font-semibold underline hover:text-red-800 dark:hover:text-red-300"
                    >
                      Open Profile Settings to add API Key →
                    </Link>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Calories (kcal) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="220"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="15"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="24"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="7"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {customError && (
                <p className="text-xs font-medium" style={{ color: "#d03b3b" }}>
                  {customError}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="w-1/3 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingCustom ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      Save Custom Food
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
