import Image from "next/image";
import type { Assignment, Entity, Problem, Report } from "@/core/types";
import { displayAddress } from "@/app/lib/privacy";
import { OutcomeButtons } from "@/components/OutcomeButtons";
import { ResidentPreview } from "@/components/ResidentPreview";

// A single work packet (build-plan §9): description, address (block level for
// sensitive types), photos (linked to the city's URLs), reporter count and
// priority factors, respondBy/resolveBy, the need/help checklist with missing
// items flagged, the 9 outcome buttons, and the resident preview panel.

interface Props {
  rank: number;
  assignment: Assignment;
  problem: Problem;
  entity: Entity;
  reports: Report[];
  owners: { id: string; name: string }[];
  residentPreview: { en: string; ht: string };
  localeLabels: { en: string; ht: string };
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Packet({
  rank,
  assignment,
  problem,
  entity,
  reports,
  owners,
  residentPreview,
  localeLabels,
}: Props) {
  const lead = reports[0];
  const photos = reports.filter((r) => r.mediaUrl).map((r) => r.mediaUrl!);
  const need = entity.need ?? [];
  const help = entity.help ?? [];
  // "Ask before dispatch" (build-plan §4.2): flag required items as missing when
  // the reporters supplied no free-text description to satisfy them.
  const missing = lead?.description ? [] : need;

  return (
    <article className="space-y-4 rounded-lg border border-neutral-300 p-5 dark:border-neutral-700">
      <header className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">
            #{rank}: {problem.serviceFamily} at {displayAddress(problem.neighborhood || lead?.address || "", problem.serviceFamily)}
          </h2>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
            score {problem.priority.score.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          <span className="font-medium">Why #{rank}:</span> {problem.priority.why}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Routing: {assignment.routingReason}{" "}
          <span className="text-xs">({assignment.confidence})</span>
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Address</dt>
          <dd>{displayAddress(lead?.address ?? "", problem.serviceFamily)}</dd>
        </div>
        <div>
          <dt className="font-medium">Reporters</dt>
          <dd>{problem.reporterCount}</dd>
        </div>
        <div>
          <dt className="font-medium">Respond by</dt>
          <dd>{fmt(assignment.respondBy)}</dd>
        </div>
        <div>
          <dt className="font-medium">Resolve by</dt>
          <dd>{fmt(assignment.resolveBy)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium">Priority factors</dt>
          <dd>
            hazard {problem.priority.hazard} × people{" "}
            {problem.priority.people.toFixed(2)} × overdue{" "}
            {problem.priority.overdue.toFixed(2)}
          </dd>
        </div>
      </dl>

      {lead?.description && (
        <div className="text-sm">
          <h3 className="font-medium">Description</h3>
          <p className="text-neutral-700 dark:text-neutral-300">{lead.description}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium">Photos</h3>
          <ul className="mt-1 flex flex-wrap gap-2">
            {photos.slice(0, 4).map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  <Image
                    src={url}
                    alt="Reporter-submitted photo of the problem"
                    width={120}
                    height={90}
                    className="h-[90px] w-[120px] rounded object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <h3 className="font-medium">Required (need)</h3>
          <ul className="mt-1 space-y-1">
            {need.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true">{missing.includes(item) ? "⚠️" : "✓"}</span>
                <span className={missing.includes(item) ? "text-amber-700 dark:text-amber-400" : ""}>
                  {item}
                  {missing.includes(item) && (
                    <span className="sr-only"> (missing, ask reporter before dispatch)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Helpful (optional)</h3>
          <ul className="mt-1 space-y-1 text-neutral-600 dark:text-neutral-400">
            {help.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <OutcomeButtons
        assignmentId={assignment.id}
        entityId={entity.id}
        owners={owners}
      />

      <ResidentPreview messages={residentPreview} labels={localeLabels} />
    </article>
  );
}
