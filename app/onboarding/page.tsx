import { redirect } from "next/navigation";
import { getSessionUser } from "../_lib/auth";
import { OnboardingFlow } from "./OnboardingFlow";

// Reads the session user and health profile — must render per-request.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.onboardingCompleted) redirect("/");

  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-8">
      <OnboardingFlow firstName={user.name.split(" ")[0]} />
    </main>
  );
}
