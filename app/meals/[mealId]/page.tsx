import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { MealItemList } from "./MealItemList";
import { MealIcon } from "../../_components/MealIcon";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import { getMealEntries } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";

// Reads today's date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function MealSummaryPage(props: PageProps<"/meals/[mealId]">) {
  const { mealId } = await props.params;
  const meal = mealOptions.find((option) => option.id === mealId);

  if (!meal) {
    notFound();
  }

  const user = await requireUser();
  const items = await getMealEntries(user.id, mealId as MealId);

  const time = items.length
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
        items[0].loggedAt
      )
    : null;

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
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <MealIcon meal={meal.id} className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{meal.name}</h1>
            {time && <p className="text-sm text-zinc-500 dark:text-zinc-400">{time}</p>}
          </div>
        </div>
      </header>

      <MealItemList initialItems={items} mealId={mealId as MealId} />
    </main>
  );
}
