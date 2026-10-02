"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import {
  activityLevelOptions,
  fitnessGoalLabel,
  genderOptions,
  type ActivityLevel,
  type FitnessGoal,
  type Gender,
} from "../_lib/profile-options";
import { computeGoals } from "../_lib/nutrition";
import { weeklyMoveGoalOptions } from "../_lib/movement";

type ProfileData = {
  name: string;
  age: number;
  gender: Gender;
  weightLbs: number;
  heightFeet: number;
  heightInches: number;
  activityLevel: ActivityLevel;
  dailyCalorieGoal: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatGoalG: number;
  waterGoalOz: number;
  fitnessGoal: FitnessGoal;
  weeklyMoveGoalMin: number;
  addExerciseToBudget: boolean;
  remindersEnabled: boolean;
  units: string;
  timezone: string;
  openRouterApiKey: string;
};

type BasicForm = {
  name: string;
  age: string;
  gender: Gender;
  weightLbs: string;
  heightFeet: string;
  heightInches: string;
  activityLevel: ActivityLevel;
};

type TargetKey = "dailyCalorieGoal" | "proteinGoalG" | "carbsGoalG" | "fatGoalG" | "waterGoalOz";

const inputClass =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-sand-600";
const primaryButton =
  "flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60";

function chipClass(selected: boolean) {
  return `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    selected ? "bg-forest-700 text-white" : "bg-sand-100 text-sand-600 hover:bg-sand-200"
  }`;
}

const TARGET_META: {
  key: TargetKey;
  label: string;
  suffix: string;
  dot?: string;
  min: number;
  max: number;
}[] = [
  { key: "dailyCalorieGoal", label: "Calories", suffix: "kcal", min: 800, max: 8000 },
  { key: "proteinGoalG", label: "Protein", suffix: "g", dot: "bg-forest-700", min: 10, max: 500 },
  { key: "carbsGoalG", label: "Carbs", suffix: "g", dot: "bg-coral-600", min: 10, max: 800 },
  { key: "fatGoalG", label: "Fat", suffix: "g", dot: "bg-amber-500", min: 5, max: 300 },
  { key: "waterGoalOz", label: "Water", suffix: "oz", dot: "bg-lagoon-500", min: 8, max: 300 },
];

// Shown if the runtime lacks Intl.supportedValuesOf (older browsers).
const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function supportedTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try {
    const zones = intl.supportedValuesOf?.("timeZone");
    if (zones && zones.length) return zones;
  } catch {
    // Fall back to the shortlist below.
  }
  return FALLBACK_TIME_ZONES;
}

// The full IANA list is read on the client only (via useSyncExternalStore) so a
// slightly different ICU list between server and browser can't break hydration.
let cachedTimeZones: string[] | null = null;
function timeZoneSnapshot(): string[] {
  if (!cachedTimeZones) {
    const zones = supportedTimeZones();
    cachedTimeZones = zones.includes("UTC") ? zones : ["UTC", ...zones];
  }
  return cachedTimeZones;
}
function timeZoneServerSnapshot(): string[] {
  return FALLBACK_TIME_ZONES;
}
function subscribeToTimeZones(): () => void {
  return () => {};
}

export function ProfileForm({ initial, streak }: { initial: ProfileData; streak: number }) {
  const router = useRouter();

  const [form, setForm] = useState<ProfileData>(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [editOpen, setEditOpen] = useState(false);
  const [basic, setBasic] = useState<BasicForm>(() => toBasicForm(initial));

  const [editingTarget, setEditingTarget] = useState<TargetKey | null>(null);
  const [targetValue, setTargetValue] = useState("");
  const [targetSaving, setTargetSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [moveGoalOpen, setMoveGoalOpen] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaveState, setApiKeySaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [loggingOut, setLoggingOut] = useState(false);

  const availableTimeZones = useSyncExternalStore(
    subscribeToTimeZones,
    timeZoneSnapshot,
    timeZoneServerSnapshot
  );
  const timeZoneOptions = availableTimeZones.includes(form.timezone)
    ? availableTimeZones
    : [form.timezone, ...availableTimeZones];

  const initialLetter = form.name.trim().charAt(0).toUpperCase() || "?";

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function patchProfile(patch: Record<string, unknown>) {
    return fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function handleSaveBasic() {
    setSaveState("saving");
    const res = await patchProfile({
      name: basic.name,
      age: Number(basic.age),
      gender: basic.gender,
      weightLbs: Number(basic.weightLbs),
      heightFeet: Number(basic.heightFeet),
      heightInches: Number(basic.heightInches || 0),
      activityLevel: basic.activityLevel,
    });

    if (res.ok) {
      const updated = (await res.json()) as ProfileData;
      setForm((prev) => ({ ...prev, ...updated }));
      setSaveState("saved");
      setEditOpen(false);
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      setSaveState("idle");
    }
  }

  function openTarget(key: TargetKey) {
    setEditingTarget(key);
    setTargetValue(String(form[key]));
  }

  async function handleTargetSave() {
    if (!editingTarget) return;
    const value = Number(targetValue);
    setTargetSaving(true);
    const res = await patchProfile({ [editingTarget]: value });
    setTargetSaving(false);
    if (res.ok) {
      update(editingTarget, value);
      setEditingTarget(null);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    const goals = computeGoals({
      age: form.age,
      gender: form.gender,
      weightLbs: form.weightLbs,
      heightFeet: form.heightFeet,
      heightInches: form.heightInches,
      activityLevel: form.activityLevel,
      goal: form.fitnessGoal,
    });
    const res = await patchProfile(goals);
    setRecalculating(false);
    if (res.ok) {
      const updated = (await res.json()) as ProfileData;
      setForm((prev) => ({ ...prev, ...updated }));
    }
  }

  async function toggleReminders() {
    const next = !form.remindersEnabled;
    update("remindersEnabled", next);
    await patchProfile({ remindersEnabled: next });
  }

  async function toggleUnits() {
    const next = form.units === "metric" ? "imperial" : "metric";
    update("units", next);
    await patchProfile({ units: next });
  }

  async function handleTimeZoneChange(timeZone: string) {
    update("timezone", timeZone);
    await patchProfile({ timezone: timeZone });
    router.refresh();
  }

  async function toggleExerciseBudget() {
    const next = !form.addExerciseToBudget;
    update("addExerciseToBudget", next);
    await patchProfile({ addExerciseToBudget: next });
  }

  async function handleMoveGoalSave(minutes: number) {
    update("weeklyMoveGoalMin", minutes);
    setMoveGoalOpen(false);
    await patchProfile({ weeklyMoveGoalMin: minutes });
  }

  async function handleSaveApiKey() {
    setApiKeySaveState("saving");
    await patchProfile({ openRouterApiKey: form.openRouterApiKey });
    setApiKeySaveState("saved");
    setTimeout(() => setApiKeySaveState("idle"), 2000);
  }

  async function handlePasswordSubmit() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPasswordSaving(false);

    if (!res.ok) {
      setPasswordError(data.error ?? "Something went wrong.");
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const unitsLabel = form.units === "metric" ? "g · kg" : "oz · lb";

  return (
    <div className="flex flex-col gap-5">
      {/* Identity */}
      <section className="card p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-700 font-display text-2xl font-bold text-white">
            {initialLetter}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl font-bold text-forest-900">{form.name}</p>
            <p className="text-sm text-sand-500">
              Goal: {fitnessGoalLabel(form.fitnessGoal)} · {streak}-day streak
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBasic(toBasicForm(form));
              setEditOpen(true);
            }}
            className="shrink-0 rounded-full bg-forest-100 px-4 py-2 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-200"
          >
            Edit
          </button>
        </div>
      </section>

      {/* Daily targets */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-forest-900">Daily targets</h2>
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1 text-xs font-semibold text-forest-700 disabled:opacity-60"
          >
            {recalculating && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} aria-hidden />}
            Recalculate
          </button>
        </div>

        <div className="mt-2 divide-y divide-sand-100">
          {TARGET_META.map((target) => (
            <button
              key={target.key}
              type="button"
              onClick={() => openTarget(target.key)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:opacity-80"
            >
              <span className="flex items-center gap-2.5">
                {target.dot && <span className={`h-2.5 w-2.5 rounded-full ${target.dot}`} />}
                <span className="text-sand-600">{target.label}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums text-forest-900">
                  {form[target.key].toLocaleString()} {target.suffix}
                </span>
                <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Movement */}
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold text-forest-900">Movement</h2>
        <div className="mt-2 divide-y divide-sand-100">
          <button
            type="button"
            onClick={() => setMoveGoalOpen(true)}
            className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:opacity-80"
          >
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-plum-600" />
              <span className="text-sand-600">Weekly goal</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold tabular-nums text-forest-900">
                {form.weeklyMoveGoalMin > 0 ? `${form.weeklyMoveGoalMin} min` : "None"}
              </span>
              <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
            </span>
          </button>
          <button
            type="button"
            onClick={toggleExerciseBudget}
            className="flex w-full items-center justify-between gap-3 pt-3.5 text-left"
          >
            <span className="text-sand-600">Add exercise to calories</span>
            <span className="flex items-center gap-1.5 font-semibold text-forest-900">
              {form.addExerciseToBudget ? "On" : "Off"}
              <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
            </span>
          </button>
        </div>
      </section>

      {/* Preferences */}
      <section className="card divide-y divide-sand-100 p-5">
        <button
          type="button"
          onClick={toggleReminders}
          className="flex w-full items-center justify-between gap-3 pb-3.5 text-left"
        >
          <span className="text-sand-600">Reminders</span>
          <span className="flex items-center gap-1.5 font-semibold text-forest-900">
            {form.remindersEnabled ? "On" : "Off"}
            <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
          </span>
        </button>
        <button
          type="button"
          onClick={toggleUnits}
          className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        >
          <span className="text-sand-600">Units</span>
          <span className="flex items-center gap-1.5 font-semibold text-forest-900">
            {unitsLabel}
            <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
          </span>
        </button>
        <label className="flex w-full items-center justify-between gap-3 py-3.5">
          <span className="text-sand-600">Time zone</span>
          <select
            value={form.timezone}
            onChange={(e) => void handleTimeZoneChange(e.target.value)}
            aria-label="Time zone"
            className="max-w-[62%] rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-sm font-semibold text-forest-900 focus:border-forest-500 focus:outline-none"
          >
            {timeZoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <div className="flex w-full items-center justify-between gap-3 py-3.5" title="Connected apps are coming soon">
          <span className="text-sand-600">Connected apps</span>
          <span className="flex items-center gap-1.5 font-semibold text-forest-900">
            Health
            <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
          </span>
        </div>
        <div className="flex w-full items-center justify-between gap-3 pt-3.5" title="Dark mode is coming soon">
          <span className="text-sand-600">Appearance</span>
          <span className="flex items-center gap-1.5 font-semibold text-forest-900">
            Light
            <ChevronRight className="h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </section>

      {/* AI features */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-forest-900">
          <Sparkles className="h-4.5 w-4.5 text-sand-400" strokeWidth={1.75} aria-hidden />
          AI features
        </h2>
        <p className="mb-4 mt-1 text-sm text-sand-500">
          Add an OpenRouter API key to unlock AI-powered meal parsing and nutrition estimation.
        </p>

        <label className={labelClass}>OpenRouter API key</label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={form.openRouterApiKey}
            onChange={(e) => update("openRouterApiKey", e.target.value)}
            placeholder="sk-or-v1-..."
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((prev) => !prev)}
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
          >
            {showApiKey ? (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveApiKey}
          disabled={apiKeySaveState === "saving"}
          className={`${primaryButton} mt-4`}
        >
          {apiKeySaveState === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {apiKeySaveState === "saved" ? "Saved" : "Save changes"}
            </>
          )}
        </button>
      </section>

      {/* Change password */}
      <section className="card p-5">
        <button
          type="button"
          onClick={() => setPasswordOpen((prev) => !prev)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-forest-900">
            <Lock className="h-4.5 w-4.5 text-sand-400" strokeWidth={1.75} aria-hidden />
            Change password
          </h2>
          <ChevronRight
            className={`h-4.5 w-4.5 text-sand-400 transition-transform ${passwordOpen ? "rotate-90" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>

        {passwordOpen && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {passwordError && <p className="text-sm font-medium text-coral-700">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm font-medium text-forest-700">Password updated.</p>}

            <button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className={primaryButton}
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                  Updating…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Update password
                </>
              )}
            </button>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-sand-300 px-4 py-3 text-sm font-semibold text-sand-500 transition-colors hover:border-coral-300 hover:text-coral-700 disabled:opacity-60"
      >
        {loggingOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
            Logging out…
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Log out
          </>
        )}
      </button>

      <p className="pb-1 text-center text-xs text-sand-400">
        SparkNourish · A Sparkwell Creative product
      </p>

      {/* Edit basic info modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-forest-900">
                <UserRound className="h-4.5 w-4.5 text-sand-400" strokeWidth={1.75} aria-hidden />
                Edit profile
              </h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={basic.name}
                  onChange={(e) => setBasic((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <span className={labelClass}>Gender</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {genderOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBasic((prev) => ({ ...prev, gender: option.id }))}
                      className={chipClass(basic.gender === option.id)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    value={basic.age}
                    onChange={(e) => setBasic((prev) => ({ ...prev, age: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Weight (lbs)</label>
                  <input
                    type="number"
                    value={basic.weightLbs}
                    onChange={(e) => setBasic((prev) => ({ ...prev, weightLbs: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>Height</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={basic.heightFeet}
                    onChange={(e) => setBasic((prev) => ({ ...prev, heightFeet: e.target.value }))}
                    className={inputClass}
                    placeholder="ft"
                    aria-label="Height (feet)"
                  />
                  <input
                    type="number"
                    value={basic.heightInches}
                    onChange={(e) => setBasic((prev) => ({ ...prev, heightInches: e.target.value }))}
                    className={inputClass}
                    placeholder="in"
                    aria-label="Height (inches)"
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>Activity level</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activityLevelOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBasic((prev) => ({ ...prev, activityLevel: option.id }))}
                      className={chipClass(basic.activityLevel === option.id)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveBasic}
              disabled={saveState === "saving"}
              className={`${primaryButton} mt-5`}
            >
              {saveState === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  {saveState === "saved" ? "Saved" : "Save changes"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit target modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">
                Edit {TARGET_META.find((t) => t.key === editingTarget)?.label}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <label className={labelClass}>
              {TARGET_META.find((t) => t.key === editingTarget)?.suffix}
            </label>
            <input
              type="number"
              autoFocus
              min={TARGET_META.find((t) => t.key === editingTarget)?.min}
              max={TARGET_META.find((t) => t.key === editingTarget)?.max}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className={inputClass}
            />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="w-1/3 rounded-xl border border-sand-200 py-2.5 text-sm font-semibold text-sand-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTargetSave}
                disabled={targetSaving || !targetValue}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
              >
                {targetSaving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly movement goal modal */}
      {moveGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-forest-900">Weekly movement goal</h3>
              <button
                type="button"
                onClick={() => setMoveGoalOpen(false)}
                aria-label="Close"
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {weeklyMoveGoalOptions.map((option) => {
                const selected = form.weeklyMoveGoalMin === option.minutes;
                return (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => handleMoveGoalSave(option.minutes)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${
                      selected ? "border-plum-600" : "border-transparent bg-sand-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-forest-900">
                          {option.name}
                        </span>
                        {option.suggested && (
                          <span className="rounded-full bg-plum-100 px-2 py-0.5 text-xs font-semibold text-plum-700">
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
                onClick={() => handleMoveGoalSave(0)}
                className={`mx-auto mt-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  form.weeklyMoveGoalMin === 0
                    ? "bg-plum-100 text-plum-700"
                    : "text-sand-600 hover:text-forest-800"
                }`}
              >
                No movement goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toBasicForm(profile: ProfileData): BasicForm {
  return {
    name: profile.name,
    age: String(profile.age),
    gender: profile.gender,
    weightLbs: String(profile.weightLbs),
    heightFeet: String(profile.heightFeet),
    heightInches: String(profile.heightInches),
    activityLevel: profile.activityLevel,
  };
}
