"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activityLevelOptions,
  genderOptions,
  type ActivityLevel,
  type Gender,
} from "../_lib/profile-options";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const primaryButton =
  "w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60";

function chipClass(selected: boolean) {
  return `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    selected
      ? "bg-emerald-600 text-white"
      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
  }`;
}

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!gender) return setError("Select a gender.");
    if (!activityLevel) return setError("Select an activity level.");

    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        gender,
        age: Number(age),
        weightLbs: Number(weightLbs),
        heightFeet: Number(heightFeet),
        heightInches: Number(heightInches || 0),
        activityLevel,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      // Account-level problems (e.g. duplicate email) live on step 1.
      if (res.status === 409) setStep(1);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const errorText = error && (
    <p className="text-sm font-medium" style={{ color: "#d03b3b" }}>
      {error}
    </p>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Step {step} of 2</p>

      {step === 1 ? (
        <form
          onSubmit={handleContinue}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {errorText}

          <button type="submit" className={primaryButton}>
            Continue
          </button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-600 dark:text-emerald-400">
              Log in
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
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
                required
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="weight" className={labelClass}>Weight (lbs)</label>
              <input
                id="weight"
                type="number"
                required
                min={50}
                max={700}
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>Height</span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                required
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

          <div>
            <span className={labelClass}>Activity level</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activityLevelOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivityLevel(option.id)}
                  className={chipClass(activityLevel === option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {errorText}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="w-1/3 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              Back
            </button>
            <button type="submit" disabled={submitting} className={`${primaryButton} flex-1`}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
