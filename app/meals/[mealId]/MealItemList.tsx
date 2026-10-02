"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, BookmarkPlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { MacroBar } from "../../_components/MacroBar";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import type { FoodLogEntry } from "../../../db/schema";

const inputClass =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-sand-600";

export function MealItemList({
  initialItems,
  mealId,
}: {
  initialItems: FoodLogEntry[];
  mealId: MealId;
}) {
  const router = useRouter();
  const [items, setItems] = useState<FoodLogEntry[]>(initialItems);
  const [editingItem, setEditingItem] = useState<FoodLogEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Save as meal" template state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savingMeal, setSavingMeal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMealName, setSavedMealName] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editMealType, setEditMealType] = useState<MealId>(mealId);

  const totals = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: Math.round((sum.protein + item.proteinG) * 10) / 10,
      carbs: Math.round((sum.carbs + item.carbsG) * 10) / 10,
      fat: Math.round((sum.fat + item.fatG) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function startEdit(item: FoodLogEntry) {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity);
    setEditCalories(String(item.calories));
    setEditProtein(String(item.proteinG));
    setEditCarbs(String(item.carbsG));
    setEditFat(String(item.fatG));
    setEditMealType(item.mealType as MealId);
    setError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/food-log/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        quantity: editQuantity,
        calories: Number(editCalories),
        protein: Number(editProtein),
        carbs: Number(editCarbs),
        fat: Number(editFat),
        mealType: editMealType,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update item.");
      return;
    }

    const updated: FoodLogEntry = await res.json();

    if (editMealType !== mealId) {
      // If moved to another meal, remove from this meal's view
      setItems((prev) => prev.filter((i) => i.id !== editingItem.id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }

    setEditingItem(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this food item?")) return;

    setDeletingId(id);
    const res = await fetch(`/api/food-log/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      alert("Failed to delete food item. Please try again.");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  function openSaveModal() {
    setSaveName("");
    setSaveError(null);
    setShowSaveModal(true);
  }

  async function handleSaveMeal(e: React.FormEvent) {
    e.preventDefault();
    const name = saveName.trim();
    if (!name || !items.length || savingMeal) return;

    setSavingMeal(true);
    setSaveError(null);

    const res = await fetch("/api/saved-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.proteinG,
          carbs: item.carbsG,
          fat: item.fatG,
        })),
      }),
    });

    setSavingMeal(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error || "Failed to save meal. Please try again.");
      return;
    }

    setShowSaveModal(false);
    setSavedMealName(name);
  }

  return (
    <>
      <section className="card p-5">
        <p className="font-display text-4xl font-bold tabular-nums text-forest-900">
          {totals.calories}
          <span className="ml-1 text-base font-medium text-sand-500">kcal total</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <MacroBar label="Protein" grams={totals.protein} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} kind="fat" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-forest-900">Logged items</h2>
          <div className="flex shrink-0 items-center gap-3">
            {items.length > 0 && (
              <button
                type="button"
                onClick={openSaveModal}
                className="flex items-center gap-1 text-sm font-semibold text-forest-700"
              >
                <BookmarkPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                Save meal
              </button>
            )}
            <Link
              href={`/add-food?meal=${mealId}`}
              className="flex items-center gap-1 text-sm font-semibold text-forest-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Add food
            </Link>
          </div>
        </div>

        {savedMealName && (
          <p className="mb-3 text-xs font-medium text-forest-700">
            Saved “{savedMealName}” to My meals.
          </p>
        )}

        <ul className="card divide-y divide-sand-100 overflow-hidden">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-forest-900">{item.name}</p>
                <p className="text-xs text-sand-500">
                  {item.quantity} · {Math.round(item.proteinG)}P {Math.round(item.carbsG)}C{" "}
                  {Math.round(item.fatG)}F
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="shrink-0 font-display font-bold tabular-nums text-forest-900">
                  {item.calories}
                  <span className="ml-1 text-xs font-medium text-sand-500">kcal</span>
                </p>

                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 transition-colors hover:bg-sand-100 hover:text-forest-700"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 transition-colors hover:bg-coral-50 hover:text-coral-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-sand-500">
              Nothing logged for this meal yet.
            </li>
          )}
        </ul>
      </section>

      {/* Save as meal modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Save as meal</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-sand-400 hover:text-sand-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Meal name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={80}
                  placeholder="e.g. My usual lunch"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="rounded-tile bg-sand-50 p-3 text-sm text-sand-600">
                {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
                <span className="font-semibold text-forest-900">{totals.calories} kcal</span>
              </div>

              {saveError && <p className="text-xs font-semibold text-coral-700">{saveError}</p>}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="w-1/3 rounded-xl border border-sand-200 py-2.5 text-xs font-semibold text-sand-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMeal || !saveName.trim()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
                >
                  {savingMeal ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                      Save meal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Edit logged food</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-sand-400 hover:text-sand-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Food name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Serving / quantity</label>
                <input
                  type="text"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 1 cup, 6 oz"
                />
              </div>

              <div>
                <label className={labelClass}>Meal</label>
                <select
                  value={editMealType}
                  onChange={(e) => setEditMealType(e.target.value as MealId)}
                  className={inputClass}
                >
                  {mealOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={editProtein}
                    onChange={(e) => setEditProtein(e.target.value)}
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
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={editFat}
                    onChange={(e) => setEditFat(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-coral-700">{error}</p>}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-1/3 rounded-xl border border-sand-200 py-2 text-xs font-semibold text-sand-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
