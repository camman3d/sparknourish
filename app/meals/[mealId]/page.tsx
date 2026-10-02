import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { MealItemList } from "./MealItemList";
import { MealIcon, mealTint } from "../../_components/MealIcon";
import { mealOptions, type MealId } from "../../_lib/mock-data";
import { dateKey, parseDateKey, todayUtc } from "../../_lib/calendar";
import { getMealEntries } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";

// Reads the selected date and live food-log data — must render per-request.
export const dynamic = "force-dynamic";

export default async function MealSummaryPage(props: PageProps<"/meals/[mealId]">) {
  const { mealId } = await props.params;
  const searchParams = await props.searchParams;
  const meal = mealOptions.find((option) => option.id === mealId);

  if (!meal) {
    notFound();
  }

  const requestedDate = Array.isArray(searchParams.date) ? searchParams.date[0] : searchParams.date;
  const date = parseDateKey(requestedDate) ?? todayUtc();
  const dateParam = dateKey(date);

  const user = await requireUser();
  const items = await getMealEntries(user.id, mealId as MealId, date);

  const time = items.length
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
        items[0].loggedAt
      )
    : null;

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/?date=${dateParam}`}
          aria-label="Back to diary"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest-900 shadow-card"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${mealTint[meal.id]}`}
          >
            <MealIcon meal={meal.id} className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-forest-900">{meal.name}</h1>
            {time && <p className="text-sm text-sand-500">{time}</p>}
          </div>
        </div>
      </header>

      <MealItemList initialItems={items} mealId={mealId as MealId} />
    </main>
  );
}
