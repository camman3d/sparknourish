import { redirect } from "next/navigation";
import { getMovementEntry } from "../../../db/queries";
import { requireUser } from "../../_lib/auth";
import { LogActivityForm } from "./LogActivityForm";

// Reads the session user and an optional entry being edited — per-request.
export const dynamic = "force-dynamic";

export default async function LogActivityPage(props: PageProps<"/move/log">) {
  const params = await props.searchParams;
  const requested = Array.isArray(params.edit) ? params.edit[0] : params.edit;

  const user = await requireUser();

  let editing: Awaited<ReturnType<typeof getMovementEntry>> = null;
  if (requested) {
    const id = parseInt(requested, 10);
    if (Number.isInteger(id)) editing = await getMovementEntry(user.id, id);
    if (!editing) redirect("/move");
  }

  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pb-6 pt-8">
      <LogActivityForm
        weightLbs={user.weightLbs}
        editing={
          editing
            ? {
                id: editing.id,
                activity: editing.activity,
                durationMin: editing.durationMin,
                intensity: editing.intensity,
              }
            : null
        }
      />
    </main>
  );
}
