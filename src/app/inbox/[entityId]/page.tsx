import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/db/getRepo";
import { entityById, etaLine, familyLabel, loadEntities } from "@/core/entities";
import { localeLabel } from "@/core/language";
import { TRIAGE_ID } from "@/core/types";
import { replayNextAction } from "@/app/actions";
import { Chip, ConfidenceChip, KindBadge } from "@/components/ui";
import { Banner } from "@/components/Banner";
import { EntitySwitcher } from "@/components/EntitySwitcher";
import { fmtDay } from "@/components/format";
import { nameOf } from "@/components/names";

export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function InboxPage({ params, searchParams }: PageProps<"/inbox/[entityId]">) {
  const { entityId } = await params;
  const sp = await searchParams;
  const entity = entityById(entityId);
  if (!entity && entityId !== TRIAGE_ID) notFound();

  const repo = getRepo();
  const nonEnglish = one(sp.lang) === "other";
  const [items, ov] = await Promise.all([repo.listInbox(entityId, 50, { nonEnglish }), repo.overview()]);
  const counts = ov.entities.find((c) => c.entityId === entityId);
  const options = [...loadEntities().map((e) => ({ id: e.id, name: e.name })), { id: TRIAGE_ID, name: "Ops triage" }];
  const name = nameOf(entityId);
  const eta = entity ? etaLine(entity) : undefined;

  const replayed = one(sp.replayed);
  const landed = one(sp.landed);
  const confidence = one(sp.confidence);
  const error = one(sp.error);

  return (
    <div>
      {error && <Banner tone="bad">{error}</Banner>}
      {replayed && landed && (
        <Banner tone={confidence === "learned" ? "good" : "accent"}>
          <p className="font-medium">
            New report landed in {nameOf(landed)} · {confidence === "learned" ? "learned rule" : confidence} ·{" "}
            {one(sp.joined) === "1" ? "joined an existing problem" : "started a new problem"}
          </p>
          <p className="mt-1 flex flex-wrap gap-4 text-sm">
            <Link href={`/packet/${replayed}`} className="font-medium text-accent underline">Open the packet</Link>
            {landed !== entityId && (
              <Link href={`/inbox/${landed}`} className="font-medium text-accent underline">Go to {nameOf(landed)} inbox</Link>
            )}
          </p>
        </Banner>
      )}

      <header className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Inbox</p>
            <h1 className="mt-0.5 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
              {name} <KindBadge kind={entity?.kind ?? "triage"} />
            </h1>
            {entity && entity.queues.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entity.queues.map((q) => (
                  <Chip key={q}>{q}</Chip>
                ))}
              </div>
            )}
            {eta && <p className="mt-2 text-xs text-muted">{eta}</p>}
          </div>
          <EntitySwitcher current={entityId} options={options} />
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
          <dl className="flex gap-6">
            <div>
              <dt className="text-xs text-muted">Open</dt>
              <dd className="text-xl font-semibold tabular-nums">{counts?.open ?? items.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Overdue</dt>
              <dd className={`text-xl font-semibold tabular-nums ${(counts?.overdue ?? 0) > 0 ? "text-warn" : ""}`}>{counts?.overdue ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Non-English reporters</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {counts?.nonEnglish ?? 0}
                {(counts?.nonEnglish ?? 0) > 0 && (
                  <Link
                    href={nonEnglish ? `/inbox/${entityId}` : `/inbox/${entityId}?lang=other`}
                    className="ml-2 align-middle text-xs font-medium text-accent underline"
                  >
                    {nonEnglish ? "show all" : "show only these"}
                  </Link>
                )}
              </dd>
            </div>
          </dl>
          <form action={replayNextAction} className="flex items-center gap-2">
            <input type="hidden" name="entityId" value={entityId} />
            <span className="text-xs text-muted">{ov.replayRemaining} held-back {ov.replayRemaining === 1 ? "report" : "reports"}</span>
            <button type="submit" className="min-h-10 rounded-md bg-accent px-3 font-medium text-white dark:text-black hover:opacity-90">
              ▶ Replay next report
            </button>
          </form>
        </div>
      </header>

      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Ranked queue · hazard × people × overdue</h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-muted">Nothing open. Inbox zero.</p>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {items.map((it) => {
            const langs = it.reporterLanguages.filter((l) => l !== "en");
            return (
              <li key={it.assignment.id}>
                <Link href={`/packet/${it.assignment.id}`} className="flex gap-3 p-3 hover:bg-surface-2 sm:gap-4">
                  <span className="w-8 shrink-0 text-right text-2xl font-semibold tabular-nums text-muted">{it.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {familyLabel(it.problem.serviceFamily)} · <span className="font-normal">{it.problem.address}</span>
                    </p>
                    <p className="mt-0.5 text-xs">
                      <span className="font-semibold text-accent">Why #{it.rank}:</span> {it.problem.priority.why}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <ConfidenceChip confidence={it.assignment.confidence} />
                      {it.overdue ? <Chip tone="bad">overdue</Chip> : null}
                      <Chip>respond by {fmtDay(it.assignment.respondBy)}</Chip>
                      <Chip>{it.problem.reporterCount} {it.problem.reporterCount === 1 ? "person" : "people"}</Chip>
                      {langs.map((l) => (
                        <Chip key={l} tone="accent">{localeLabel(l)}</Chip>
                      ))}
                    </div>
                    {it.description && <p className="mt-1 truncate text-xs text-muted">{it.description}</p>}
                  </div>
                  {it.firstPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.firstPhotoUrl} alt="Reporter photo" width={64} height={48} loading="lazy" className="h-12 w-16 shrink-0 rounded object-cover" />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
