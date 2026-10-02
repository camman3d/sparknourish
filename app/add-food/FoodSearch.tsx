"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Plus,
  ScanBarcode,
  Search,
  Soup,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { mealOptions, type MealId } from "../_lib/mock-data";
import type { CustomFood, UsdaFood } from "../../db/schema";

type RecentFoodProp = {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type UnifiedFood = {
  id: string;
  source: "custom" | "usda" | "recent";
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

/** An item added to the pending "Add to log" cart. */
type StagedItem = {
  foodId: string;
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const inputClass =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-sand-600";

const round1 = (value: number) => Math.round(value * 10) / 10;

function ActionTile({
  icon: Icon,
  label,
  onClick,
  title,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="tile flex flex-col items-center gap-2 px-2 py-4 text-forest-700 transition-transform active:scale-[0.98]"
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      <span className="text-sm font-semibold text-forest-900">{label}</span>
    </button>
  );
}

export function FoodSearch({
  initialMeal,
  date,
  recent,
}: {
  initialMeal: MealId;
  date: string;
  recent: RecentFoodProp[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"search" | "ai">("search");
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [results, setResults] = useState<UnifiedFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [createdFoods, setCreatedFoods] = useState<UnifiedFood[]>([]);
  const [staged, setStaged] = useState<StagedItem[]>([]);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Portion adjuster state for clicked food
  const [portionFood, setPortionFood] = useState<UnifiedFood | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);

  // Custom food modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customServing, setCustomServing] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customFiber, setCustomFiber] = useState("");
  const [customSugar, setCustomSugar] = useState("");
  const [customSodium, setCustomSodium] = useState("");
  const [customCholesterol, setCustomCholesterol] = useState("");
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

  const recentFoods: UnifiedFood[] = recent.map((food, index) => ({
    id: `recent-${index}-${food.name}`,
    source: "recent",
    name: food.name,
    servingSize: food.quantity,
    calories: food.calories,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
  }));

  const listFoods = query.trim() ? results : recentFoods;
  const displayFoods = createdFoods.length
    ? [...createdFoods, ...listFoods.filter((f) => !createdFoods.some((c) => c.id === f.id))]
    : listFoods;

  const mealName = mealOptions.find((option) => option.id === meal)?.name ?? "Meal";
  const cartCalories = staged.reduce((sum, item) => sum + item.calories, 0);

  // Search effect with debounce. Recent foods are shown when the query is empty.
  useEffect(() => {
    const trimmed = query.trim();
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      if (!trimmed) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(trimmed)}`);
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

  function isStaged(foodId: string) {
    return staged.some((item) => item.foodId === foodId);
  }

  function stageFood(food: UnifiedFood, multiplier = 1) {
    const item: StagedItem = {
      foodId: food.id,
      name: food.name,
      quantity:
        multiplier === 1 ? food.servingSize : `${multiplier}× (${food.servingSize})`,
      calories: Math.round(food.calories * multiplier),
      proteinG: round1(food.proteinG * multiplier),
      carbsG: round1(food.carbsG * multiplier),
      fatG: round1(food.fatG * multiplier),
    };
    setStaged((prev) => [...prev, item]);
  }

  function unstageFood(foodId: string) {
    setStaged((prev) => prev.filter((item) => item.foodId !== foodId));
  }

  async function handleCommit() {
    if (!staged.length) return;
    setCommitting(true);
    setError(null);

    let failed = false;
    for (const item of staged) {
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
          date,
        }),
      });
      if (!res.ok) failed = true;
    }

    setCommitting(false);
    if (failed) {
      setError("Some items could not be logged. Please try again.");
      return;
    }

    startTransition(() => {
      router.push(`/?date=${date}`);
      router.refresh();
    });
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
        fiber: Number(customFiber || 0),
        sugar: Number(customSugar || 0),
        sodium: Number(customSodium || 0),
        cholesterol: Number(customCholesterol || 0),
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

    setCreatedFoods((prev) => [newFood, ...prev]);
    setShowCustomModal(false);
    setCustomName("");
    setCustomServing("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setCustomFiber("");
    setCustomSugar("");
    setCustomSodium("");
    setCustomCholesterol("");

    // Offer the portion adjuster for the newly created food.
    setPortionFood(newFood);
    setServingsMultiplier(1);
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
          date,
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
      router.push(`/?date=${date}`);
      router.refresh();
    });
  }

  function openCustomModal() {
    setCustomEstimateError(null);
    setCustomEstimateMissingKey(false);
    setShowCustomModal(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Meal selector */}
      <div className="flex rounded-full bg-sand-200/80 p-1">
        {mealOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMeal(option.id)}
            className={`flex-1 rounded-full py-2 text-sm transition-colors ${
              meal === option.id
                ? "bg-white font-semibold text-forest-900 shadow-sm"
                : "font-medium text-sand-600 hover:text-forest-800"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-2xl bg-white py-1.5 pl-4 pr-1.5 shadow-card">
            <Search className="h-5 w-5 shrink-0 text-sand-400" strokeWidth={2} aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods, brands, meals"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-forest-900 placeholder:text-sand-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 text-sand-400 hover:text-sand-600"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            )}
            <button
              type="button"
              title="Barcode scanning is coming soon"
              aria-label="Scan barcode (coming soon)"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 text-forest-100 transition-colors hover:bg-forest-900"
            >
              <ScanBarcode className="h-5.5 w-5.5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <ActionTile
              icon={Camera}
              label="Snap photo"
              title="Photo meal logging is coming soon"
            />
            <ActionTile icon={Zap} label="Quick add" onClick={() => setMode("ai")} />
            <ActionTile icon={Soup} label="My meals" title="Saved meals are coming soon" />
          </div>

          {error && (
            <p className="text-sm font-medium text-coral-700">{error}</p>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="truncate font-display text-xl font-bold text-forest-900">
                {query.trim() ? `Results for “${query.trim()}”` : "Recent & frequent"}
              </h2>
              <button
                type="button"
                onClick={openCustomModal}
                className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-forest-700"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                New
              </button>
            </div>

            <div className="card divide-y divide-sand-100 overflow-hidden">
              {displayFoods.map((food) => {
                const added = isStaged(food.id);
                const openDetail = food.source !== "recent";
                const summary = (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-forest-900">{food.name}</span>
                      {food.source === "custom" && (
                        <span className="shrink-0 rounded-md bg-forest-50 px-1.5 py-0.5 text-[10px] font-semibold text-forest-700">
                          Custom
                        </span>
                      )}
                      {food.brandOwner && (
                        <span className="shrink-0 truncate text-[10px] text-sand-400">
                          · {food.brandOwner}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-sand-500">
                      {food.servingSize} · {food.calories} kcal · {Math.round(food.proteinG)}P{" "}
                      {Math.round(food.carbsG)}C {Math.round(food.fatG)}F
                    </span>
                  </>
                );
                return (
                  <div key={food.id} className="flex items-center gap-3 px-4 py-3.5">
                    {openDetail ? (
                      <Link
                        href={`/food/${food.id}?meal=${meal}&date=${date}`}
                        className="min-w-0 flex-1 text-left"
                      >
                        {summary}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setPortionFood(food);
                          setServingsMultiplier(1);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        {summary}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => (added ? unstageFood(food.id) : stageFood(food))}
                      aria-label={added ? `Remove ${food.name}` : `Add ${food.name}`}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                        added
                          ? "bg-forest-700 text-white"
                          : "bg-forest-100 text-forest-700 hover:bg-forest-200"
                      }`}
                    >
                      {added ? (
                        <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                      )}
                    </button>
                  </div>
                );
              })}

              {searching && (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-sand-500">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                  Searching…
                </div>
              )}

              {!searching && displayFoods.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-sand-500">
                  {query.trim()
                    ? "No foods found. Create it as a custom food below."
                    : "No recent foods yet. Search the database or create a custom food."}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openCustomModal}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-sand-300 py-3 text-sm font-medium text-sand-600 transition-colors hover:border-forest-400 hover:text-forest-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Create custom food
            </button>
          </section>
        </div>
      ) : (
        /* AI Quick add */
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setMode("search")}
            className="flex w-fit items-center gap-1 text-sm font-semibold text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Back to search
          </button>

          <form onSubmit={handleAiParse} className="card flex flex-col gap-3 p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-forest-900">
                Describe your meal
              </label>
              <p className="mb-2 text-xs text-sand-500">
                Mention ingredients, portion sizes, or restaurant meals.
              </p>
              <textarea
                rows={3}
                required
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 2 scrambled eggs, 2 slices turkey bacon, 1 piece sourdough toast with butter, and a cup of black coffee"
                className="w-full rounded-xl border border-sand-200 bg-white p-3 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none"
              />
            </div>

            {aiError && (
              <div className="rounded-xl bg-coral-50 p-3 text-xs text-coral-800">
                <p className="font-semibold">{aiError}</p>
                {aiMissingKey && (
                  <Link
                    href="/profile"
                    className="mt-1.5 inline-block font-semibold underline hover:text-coral-900"
                  >
                    Open Profile Settings to add API Key →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-forest-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                  Analyzing with AI…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  Parse meal with AI
                </>
              )}
            </button>
          </form>

          {aiParsedItems.length > 0 && (
            <div className="card flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-forest-900">
                  Estimated items ({aiParsedItems.length})
                </h3>
                <span className="text-xs text-sand-500">
                  {aiParsedItems.reduce((sum, item) => sum + item.calories, 0)} kcal total
                </span>
              </div>

              <div className="flex flex-col divide-y divide-sand-100">
                {aiParsedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-forest-900">{item.name}</p>
                      <p className="text-xs text-sand-500">
                        {item.quantity} · {Math.round(item.proteinG)}P {Math.round(item.carbsG)}C{" "}
                        {Math.round(item.fatG)}F
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold tabular-nums text-forest-900">
                        {item.calories}
                        <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiParsedItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-sand-400 hover:text-coral-600"
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
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
              >
                {aiLogging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                    Logging items…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    Log all {aiParsedItems.length} items to {mealName}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending cart */}
      {staged.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 px-5">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-3xl bg-forest-900 p-2 pl-5 shadow-lg">
            <div className="min-w-0">
              <p className="truncate text-xs text-forest-200">
                {mealName} · {staged.length} item{staged.length === 1 ? "" : "s"}
              </p>
              <p className="font-display text-xl font-bold tabular-nums text-white">
                {cartCalories}
                <span className="ml-1 text-xs font-medium text-forest-200">kcal</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCommit}
              disabled={committing}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-coral-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-700 disabled:opacity-70"
            >
              {committing && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />}
              Add to log
            </button>
          </div>
        </div>
      )}

      {/* Portion modal */}
      {portionFood && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-bold text-forest-900">
                  {portionFood.name}
                </h3>
                <p className="text-xs text-sand-500">Base portion: {portionFood.servingSize}</p>
              </div>
              <button
                type="button"
                onClick={() => setPortionFood(null)}
                className="text-sand-400 hover:text-sand-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="my-4 rounded-tile bg-sand-50 p-4 text-center">
              <p className="font-display text-3xl font-bold tabular-nums text-forest-900">
                {Math.round(portionFood.calories * servingsMultiplier)}
                <span className="ml-1 text-sm font-medium text-sand-500">kcal</span>
              </p>
              <p className="mt-1 text-xs text-sand-500">
                {round1(portionFood.proteinG * servingsMultiplier)}P ·{" "}
                {round1(portionFood.carbsG * servingsMultiplier)}C ·{" "}
                {round1(portionFood.fatG * servingsMultiplier)}F
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
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                      servingsMultiplier === num
                        ? "bg-forest-700 text-white"
                        : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                    }`}
                  >
                    {num}×
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
                <span className="text-xs text-sand-400">servings</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPortionFood(null)}
                className="w-1/3 rounded-xl border border-sand-200 py-2.5 text-xs font-semibold text-sand-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  stageFood(portionFood, servingsMultiplier);
                  setPortionFood(null);
                  setServingsMultiplier(1);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-800"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Add to {mealName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create custom food modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Create custom food</h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-sand-400 hover:text-sand-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFood} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Food name *</label>
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
                <label className={labelClass}>Serving size *</label>
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
                className="flex items-center justify-center gap-2 rounded-xl border border-forest-200 bg-forest-50 py-2 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {estimatingCustom ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                    Estimating with AI…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    Estimate nutrition from name
                  </>
                )}
              </button>

              {customEstimateError && (
                <div className="rounded-xl bg-coral-50 p-2.5 text-xs text-coral-800">
                  <p className="font-semibold">{customEstimateError}</p>
                  {customEstimateMissingKey && (
                    <Link
                      href="/profile"
                      className="mt-1 inline-block font-semibold underline hover:text-coral-900"
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

              <p className="text-xs font-semibold uppercase tracking-wide text-sand-400">
                More nutrients (optional)
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="0"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Sugar (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="0"
                    value={customSugar}
                    onChange={(e) => setCustomSugar(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Sodium (mg)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={customSodium}
                    onChange={(e) => setCustomSodium(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cholesterol (mg)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={customCholesterol}
                    onChange={(e) => setCustomCholesterol(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {customError && <p className="text-xs font-semibold text-coral-700">{customError}</p>}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="w-1/3 rounded-xl border border-sand-200 py-2.5 text-xs font-semibold text-sand-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
                >
                  {savingCustom ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      Save custom food
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
