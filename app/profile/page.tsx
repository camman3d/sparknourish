import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Profile</h1>
      </header>

      <ProfileForm />
    </main>
  );
}
