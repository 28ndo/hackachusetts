import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEntities } from "@/core/entities";
import { getRankedInbox } from "@/app/lib/views";
import { localeLabel, outcomeTemplate } from "@/core/locales";
import type { OutcomeCode } from "@/core/types";
import { EntitySwitcher } from "@/components/EntitySwitcher";
import { Packet } from "@/components/Packet";
import { ReplayButton } from "@/components/ReplayButton";

export const dynamic = "force-dynamic";

const CODES: OutcomeCode[] = [
  "FIXED",
  "MADE_SAFE",
  "SCHEDULED",
  "DEFERRED_CAPITAL",
  "NOT_OURS",
  "NOT_FOUND",
  "PRIVATE_PROPERTY",
  "DUPLICATE",
  "NEEDS_INFO",
];

export default async function InboxPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const entities = loadEntities();
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) notFound();

  const { items, total } = await getRankedInbox(entityId);

  // Candidate reroute owners for NOT_OURS: every other entity, city departments
  // included (a signal misrouted to DCR goes back to the city's signal team).
  const owners = entities
    .filter((e) => e.id !== entityId)
    .map((e) => ({ id: e.id, name: e.name }));

  // Raw resident-message templates per code; the outcome form fills {date},
  // {owner} and {note} live as the entity types, so the preview matches what
  // reporters will receive.
  const templates = Object.fromEntries(
    CODES.map((c) => [c, { en: outcomeTemplate(c, "en"), ht: outcomeTemplate(c, "ht") }]),
  ) as Record<OutcomeCode, { en: string; ht: string }>;
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
            {total.toLocaleString()} open {total === 1 ? "packet" : "packets"}, ranked by priority
            {total > items.length && ` · showing the top ${items.length}`}
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
          {items.map((it) => (
            <li key={it.assignment.id}>
              <Packet
                rank={it.rank}
                assignment={it.assignment}
                problem={it.problem}
                entity={entity}
                reports={it.reports}
                owners={owners}
                templates={templates}
                localeLabels={labels}
              />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
