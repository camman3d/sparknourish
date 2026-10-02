import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="font-display text-3xl font-bold text-forest-900">Profile</h1>
      </header>

      <ProfileForm />
    </main>
  );
}
