import Link from "next/link";
import { Activity, Plus } from "lucide-react";

/**
 * Movement summary tile from the Home design. The label links through to the
 * full Move hub; the + button jumps straight to the activity logger.
 */
export function MoveTile({ minutes, goalMin }: { minutes: number; goalMin: number }) {
  const pct = goalMin > 0 ? Math.min(100, Math.round((minutes / goalMin) * 100)) : minutes > 0 ? 100 : 0;

  return (
    <section className="tile flex flex-1 flex-col p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-600">
          <Activity className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <Link href="/move" className="min-w-0 flex-1 font-medium text-forest-900">
          Move
        </Link>
        <Link
          href="/move/log"
          aria-label="Log movement"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-700 transition-colors hover:bg-plum-200"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </Link>
      </div>

      <Link href="/move" className="mt-3 block">
        <p className="font-display text-xl font-bold tabular-nums text-forest-900">
          {minutes}
          <span className="text-base font-semibold"> min</span>
          <span className="text-sm font-medium text-sand-500">
            {goalMin > 0 ? ` of ${goalMin}` : " today"}
          </span>
        </p>
      </Link>

      {goalMin > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-plum-100">
          <div className="h-full rounded-full bg-plum-600" style={{ width: `${pct}%` }} />
        </div>
      )}
    </section>
  );
}
