import { redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "../_lib/auth";
import { SignupForm } from "./SignupForm";

// Same DB-backed check as /login — see the proxy note for why.
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="flex min-h-[80vh] flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col gap-5">
        <Image
          src="/SparkNourishLogo.png"
          alt="SparkNourish"
          width={720}
          height={341}
          priority
          className="h-16 w-auto"
        />
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-900">Create your account</h1>
          <p className="mt-1 text-sm text-sand-500">
            Just the basics for now — we&apos;ll personalize your calorie and macro goals next.
          </p>
        </div>
      </header>
      <SignupForm />
      <p className="text-center text-xs text-sand-400">A Sparkwell Creative product</p>
    </main>
  );
}
