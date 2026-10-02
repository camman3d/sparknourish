"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MacroBar } from "../../_components/MacroBar";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import type { FoodLogEntry } from "../../../db/schema";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

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

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {totals.calories} <span className="text-base font-normal text-zinc-400">kcal total</span>
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <MacroBar label="Protein" grams={totals.protein} kind="protein" />
          <MacroBar label="Carbs" grams={totals.carbs} kind="carbs" />
          <MacroBar label="Fat" grams={totals.fat} kind="fat" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Logged items</h2>
          <Link
            href={`/add-food?meal=${mealId}`}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            + Add food
          </Link>
        </div>

        <ul className="flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.quantity} · P {item.proteinG}g · C {item.carbsG}g · F {item.fatG}g
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {item.calories} <span className="text-xs font-normal text-zinc-400">kcal</span>
                </p>

                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nothing logged for this meal yet.
            </li>
          )}
        </ul>
      </section>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Edit Logged Food</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Food Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Serving / Quantity</label>
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

              {error && (
                <p className="text-xs font-medium" style={{ color: "#d03b3b" }}>
                  {error}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-1/3 rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
