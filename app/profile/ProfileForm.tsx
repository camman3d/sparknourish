"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Eye, EyeOff, Loader2, Lock, LogOut, Sparkles, UserRound } from "lucide-react";
import {
  activityLevelOptions,
  genderOptions,
  type ActivityLevel,
  type Gender,
} from "../_lib/profile-options";

type Profile = {
  name: string;
  age: number;
  gender: Gender;
  weightLbs: number;
  heightFeet: number;
  heightInches: number;
  activityLevel: ActivityLevel;
  dailyCalorieGoal: number;
  openRouterApiKey: string;
};

type FormState = {
  name: string;
  age: string;
  gender: Gender;
  weightLbs: string;
  heightFeet: string;
  heightInches: string;
  activityLevel: ActivityLevel;
  dailyCalorieGoal: string;
  openRouterApiKey: string;
};

function toFormState(profile: Profile): FormState {
  return {
    name: profile.name,
    age: String(profile.age),
    gender: profile.gender,
    weightLbs: String(profile.weightLbs),
    heightFeet: String(profile.heightFeet),
    heightInches: String(profile.heightInches),
    activityLevel: profile.activityLevel,
    dailyCalorieGoal: String(profile.dailyCalorieGoal),
    openRouterApiKey: profile.openRouterApiKey,
  };
}

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

export function ProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

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

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((profile: Profile) => setForm(toFormState(profile)));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;
    setSaveState("saving");
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        weightLbs: Number(form.weightLbs),
        heightFeet: Number(form.heightFeet),
        heightInches: Number(form.heightInches),
        activityLevel: form.activityLevel,
        dailyCalorieGoal: Number(form.dailyCalorieGoal),
      }),
    });
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  async function handleSaveApiKey() {
    if (!form) return;
    setApiKeySaveState("saving");
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openRouterApiKey: form.openRouterApiKey }),
    });
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

  if (!form) {
    return <p className="text-sm text-sand-500">Loading profile…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-forest-900">
          <UserRound className="h-4.5 w-4.5 text-sand-400" strokeWidth={1.75} aria-hidden />
          Basic info
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Gender</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {genderOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update("gender", option.id)}
                  className={chipClass(form.gender === option.id)}
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
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Weight (lbs)</label>
              <input
                type="number"
                value={form.weightLbs}
                onChange={(e) => update("weightLbs", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Height</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={form.heightFeet}
                  onChange={(e) => update("heightFeet", e.target.value)}
                  className={inputClass}
                  placeholder="ft"
                />
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={form.heightInches}
                  onChange={(e) => update("heightInches", e.target.value)}
                  className={inputClass}
                  placeholder="in"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Activity level</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activityLevelOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update("activityLevel", option.id)}
                  className={chipClass(form.activityLevel === option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Daily calorie goal</label>
            <input
              type="number"
              value={form.dailyCalorieGoal}
              onChange={(e) => update("dailyCalorieGoal", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
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
      </section>

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
          <ChevronDown
            className={`h-4.5 w-4.5 text-sand-400 transition-transform ${passwordOpen ? "rotate-180" : ""}`}
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
    </div>
  );
}
