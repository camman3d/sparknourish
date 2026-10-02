"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-forest-900 placeholder:text-sand-400 focus:border-forest-500 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-sand-600";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm font-medium text-coral-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
            Logging in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Log in
          </>
        )}
      </button>

      <p className="text-center text-sm text-sand-500">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-forest-700">
          Create an account
        </Link>
      </p>
    </form>
  );
}
