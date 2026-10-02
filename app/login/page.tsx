import { redirect } from "next/navigation";
import { BrandMark } from "../_components/BrandMark";
import { getSessionUser } from "../_lib/auth";
import { LoginForm } from "./LoginForm";

// Checks for a real (existing) user before showing the form, so a stale token
// whose account was deleted doesn't trap the user in a redirect loop.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="flex min-h-[80vh] flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <span className="font-display text-xl font-bold text-forest-900">SparkNourish</span>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-900">Welcome back</h1>
          <p className="mt-1 text-sm text-sand-500">Log in to keep tracking your meals.</p>
        </div>
      </header>
      <LoginForm />
      <p className="text-center text-xs text-sand-400">A Sparkwell Creative product</p>
    </main>
  );
}
