import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEntities } from "@/core/entities";
import { getRankedInbox, getReportsForProblem } from "@/app/lib/views";
import { localeLabel, residentMessageFor } from "@/core/locales";
import type { Outcome, Report } from "@/core/types";
import { EntitySwitcher } from "@/components/EntitySwitcher";
import { Packet } from "@/components/Packet";
import { ReplayButton } from "@/components/ReplayButton";

export const dynamic = "force-dynamic";

// A sample outcome to render the resident preview (the common "fixed" message).
function previewOutcome(assignmentId: string): Outcome {
  return {
    id: "preview",
    assignmentId,
    code: "FIXED",
    scheduledFor: "2026-11-03",
    by: "preview",
    at: "2026-10-24T18:48:00Z",
  };
}

export default async function InboxPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const entities = loadEntities();
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) notFound();

  const items = await getRankedInbox(entityId);

  // Load member reports for each problem (for photos, description, address).
  const reportsByProblem = new Map<string, Report[]>();
  for (const it of items) {
    reportsByProblem.set(it.problem.id, await getReportsForProblem(it.problem.id));
  }

  // Candidate reroute owners: state agencies and utilities (NOT_OURS targets).
  const owners = entities
    .filter((e) => e.id !== entityId && e.kind !== "city_dept")
    .map((e) => ({ id: e.id, name: e.name }));

  const labels = { en: localeLabel("en"), ht: localeLabel("ht") };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <nav className="text-sm">
        <Link href="/" className="text-blue-700 hover:underline dark:text-blue-400">
          ← Overview
        </Link>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{entity.name}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {items.length} open {items.length === 1 ? "packet" : "packets"}, ranked by priority
          </p>
        </div>
        <EntitySwitcher
          current={entityId}
          entities={entities.map((e) => ({ id: e.id, name: e.name }))}
        />
      </header>

      <section
        aria-labelledby="replay-heading"
        className="rounded-lg border border-neutral-300 p-4 dark:border-neutral-700"
      >
        <h2 id="replay-heading" className="mb-2 text-sm font-semibold">
          Replay
        </h2>
        <ReplayButton />
      </section>

      {items.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          No open packets for this entity.
        </p>
      ) : (
        <ol className="space-y-5">
          {items.map((it) => {
            const sample = previewOutcome(it.assignment.id);
            return (
              <li key={it.assignment.id}>
                <Packet
                  rank={it.rank}
                  assignment={it.assignment}
                  problem={it.problem}
                  entity={entity}
                  reports={reportsByProblem.get(it.problem.id) ?? []}
                  owners={owners}
                  residentPreview={{
                    en: residentMessageFor("FIXED", sample, "en"),
                    ht: residentMessageFor("FIXED", sample, "ht"),
                  }}
                  localeLabels={labels}
                />
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}


