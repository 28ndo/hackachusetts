import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/db/getRepo";
import { entityById, etaLine, familyLabel, loadEntities } from "@/core/entities";
import { OUTCOMES } from "@/core/outcomes";
import { allLocales, outcomeTemplate } from "@/core/locales";
import { fillTemplate } from "@/components/fill";
import { localeLabel, normalizeLocale } from "@/core/language";
import { missingItems } from "@/core/routing/route";
import { OUTCOME_CODES, TRIAGE_ID } from "@/core/types";
import type { HistoryEvent, Locale, OutcomeCode } from "@/core/types";
import { Card, Chip, ConfidenceChip } from "@/components/ui";
import { Banner } from "@/components/Banner";
import { OutcomePanel } from "@/components/OutcomePanel";
import { PacketMapLoader } from "@/components/PacketMapLoader";
import { fmtDay, fmtTime } from "@/components/format";
import { nameOf } from "@/components/names";

export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function isCode(x?: string): x is OutcomeCode {
  return !!x && (OUTCOME_CODES as string[]).includes(x);
}

const HISTORY_ICON: Record<HistoryEvent["kind"], { icon: string; label: string }> = {
  report: { icon: "●", label: "Report" },
  assignment: { icon: "→", label: "Routed" },
  outcome: { icon: "✓", label: "Outcome" },
};

function todayNY(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export default async function PacketPage({ params, searchParams }: PageProps<"/packet/[assignmentId]">) {
  const { assignmentId } = await params;
  const sp = await searchParams;
  const repo = getRepo();
  const packet = await repo.getPacket(assignmentId);
  if (!packet) notFound();

  const { assignment: a, problem: p, reports, history } = packet;
  const entity = entityById(a.entityId);
  const eta = entity ? etaLine(entity) : undefined;
  const lead = reports[0];
  const original = reports.find((r) => r.originalText);
  const cityNote = reports.find((r) => r.cityStatusNotes)?.cityStatusNotes;
  const photos = reports.flatMap((r) => r.mediaUrls).slice(0, 6);
  const missing = entity ? missingItems(entity, reports) : packet.missing;
  const road = reports.find((r) => r.roadName || r.jurisdictionCode);
  const roadName = p.roadName ?? road?.roadName;
  const jcode = p.jurisdictionCode ?? road?.jurisdictionCode;

  const locales = allLocales();
  const known = new Set(locales.map((l) => l.locale));
  const nonEn = reports.map((r) => normalizeLocale(r.preferredLanguage)).find((l) => l !== "en" && known.has(l));
  const defaultLocale: Locale = nonEn ?? "en";

  const closed = a.state === "closed" || a.state === "rerouted";
  const recorded = [...packet.outcomes].reverse().find((o) => o.assignmentId === a.id);

  const done = one(sp.done);
  const nextId = one(sp.next);
  const error = one(sp.error);
  const nextAssignment = nextId ? await repo.getAssignment(nextId) : undefined;

  const templates = Object.fromEntries(
    OUTCOME_CODES.map((c) => [c, Object.fromEntries(locales.map((l) => [l.locale, outcomeTemplate(c, l.locale)]))]),
  ) as Record<OutcomeCode, Record<Locale, string>>;
  const outcomeOptions = OUTCOME_CODES.map((c) => ({ code: c, ...OUTCOMES[c] }));
  const owners = [...loadEntities().map((e) => ({ id: e.id, name: e.name })), { id: TRIAGE_ID, name: "Ops triage" }].filter(
    (o) => o.id !== a.entityId,
  );

  return (
    <div>
      {error && <Banner tone="bad">Could not record that: {error}</Banner>}
      {isCode(done) && (
        <Banner tone="good">
          <p className="font-medium">
            {OUTCOMES[done].label} recorded. {OUTCOMES[done].nextStep}
          </p>
          {done === "NOT_OURS" && nextAssignment && (
            <p className="mt-1 text-sm">
              Rerouted to <span className="font-medium">{nameOf(nextAssignment.entityId)}</span> · rule learned for this segment ·{" "}
              <Link href={`/packet/${nextAssignment.id}`} className="font-medium text-accent underline">Open the new packet</Link> ·{" "}
              <Link href={`/inbox/${nextAssignment.entityId}`} className="font-medium text-accent underline">{nameOf(nextAssignment.entityId)} inbox</Link>
            </p>
          )}
        </Banner>
      )}

      <p className="mb-3 text-xs text-muted">
        <Link href={`/inbox/${a.entityId}`} className="hover:text-ink">← {nameOf(a.entityId)} inbox</Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: the work packet */}
        <article aria-labelledby="packet-h" className="space-y-4">
          <header>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Work packet · attempt {a.attempt}</p>
            <h1 id="packet-h" className="mt-0.5 text-xl font-semibold tracking-tight">
              {familyLabel(p.serviceFamily)} · {p.address}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1">
              <Chip tone={p.status === "resolved" ? "good" : p.status === "deferred" ? "warn" : "accent"}>problem: {p.status.replace("_", " ")}</Chip>
              <Chip tone={a.state === "closed" ? "good" : a.state === "rerouted" ? "warn" : a.state === "stale" ? "bad" : "neutral"}>packet: {a.state.replace("_", " ")}</Chip>
            </div>
            <p className="mt-3 text-sm">
              <span className="font-semibold text-accent">Why:</span> {p.priority.why}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono">
              <Chip>hazard {p.priority.hazard}</Chip>
              <span aria-hidden className="text-muted">×</span>
              <Chip>people {p.priority.people.toFixed(1)}</Chip>
              <span aria-hidden className="text-muted">×</span>
              <Chip>overdue {p.priority.overdue.toFixed(1)}</Chip>
              <Chip tone="accent">= {Math.round(p.priority.score * 10) / 10}</Chip>
            </div>
          </header>

          <Card className="border-l-4 border-l-accent p-3">
            <p className="font-medium">Owner: {nameOf(a.entityId)}</p>
            <p className="mt-0.5 text-sm">{a.routingReason}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <ConfidenceChip confidence={a.confidence} />
              {entity?.queues[0] && <Chip>{entity.queues[0]}</Chip>}
            </div>
          </Card>

          <Card className="p-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <Detail k="Reporters" v={String(p.reporterCount)} />
              <Detail k="Waiting since" v={fmtTime(p.firstReportedAt)} />
              <Detail k="Last report" v={fmtTime(p.lastReportedAt)} />
              <Detail k="Respond by" v={fmtTime(a.respondBy)} />
              <Detail k="Resolve by" v={fmtDay(a.resolveBy)} />
              {roadName && <Detail k="Road" v={jcode ? `${roadName} · Road Inventory code ${jcode}` : roadName} />}
            </dl>
            {eta && <p className="mt-2 border-t border-line pt-2 text-xs text-muted">{eta}</p>}
          </Card>

          <section aria-labelledby="desc-h">
            <h2 id="desc-h" className="text-sm font-semibold">What residents said</h2>
            <p className="mt-1">{lead?.description || <span className="text-muted">No description.</span>}</p>
            {original?.originalText && (
              <div className="mt-2 rounded-md bg-surface-2 p-2 text-sm">
                <p className="text-xs text-muted">In the reporter&apos;s words ({localeLabel(original.preferredLanguage)}):</p>
                <p lang={original.preferredLanguage} className="mt-0.5">{original.originalText}</p>
              </div>
            )}
          </section>

          {photos.length > 0 && (
            <section aria-labelledby="photos-h">
              <h2 id="photos-h" className="text-sm font-semibold">Photos from reporters</h2>
              <ul className="mt-1 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {photos.map((u, i) => (
                  <li key={u + i}>
                    <a href={u} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={`Reporter photo ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full rounded object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PacketMapLoader lat={p.lat} lon={p.lon} label={`Map of ${p.address}`} />

          {entity && ((entity.need?.length ?? 0) > 0 || (entity.help?.length ?? 0) > 0) && (
            <Card className="grid gap-3 p-3 sm:grid-cols-2">
              {(entity.need?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-sm font-semibold">What the crew needs</h2>
                  <ul className="mt-1 space-y-1 text-sm">
                    {entity.need!.map((n) => {
                      const miss = missing.includes(n);
                      return (
                        <li key={n} className={miss ? "text-warn" : "text-good"}>
                          <span aria-hidden>{miss ? "⚠ " : "✓ "}</span>
                          <span className="text-ink">{n}</span>
                          <span className="sr-only">{miss ? " (missing)" : " (provided)"}</span>
                          {miss && <span className="ml-1 text-xs">missing</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {(entity.help?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-sm font-semibold">Helpful</h2>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted">
                    {entity.help!.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {cityNote && (
            <section aria-labelledby="before-h" className="rounded-lg border border-dashed border-line p-3">
              <h2 id="before-h" className="text-sm font-semibold">Before · What the city told these reporters today:</h2>
              <blockquote className="mt-1 border-l-2 border-line pl-3 text-sm italic text-muted">{cityNote}</blockquote>
            </section>
          )}

          <section aria-labelledby="hist-h">
            <h2 id="hist-h" className="text-sm font-semibold">History</h2>
            <ol className="mt-2 border-l border-line pl-4">
              {history.map((h, i) => (
                <li key={i} className="relative pb-3">
                  <span
                    aria-hidden
                    className={`absolute -left-[23px] flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
                      h.kind === "outcome" ? "bg-good text-surface" : h.kind === "assignment" ? "bg-accent text-surface" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {HISTORY_ICON[h.kind].icon}
                  </span>
                  <p className="text-xs text-muted">
                    {fmtTime(h.at)} · {HISTORY_ICON[h.kind].label}
                  </p>
                  <p className="flex flex-wrap items-center gap-1.5 text-sm">
                    {h.text}
                    {h.kind === "assignment" && h.confidence && <ConfidenceChip confidence={h.confidence} />}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </article>

        {/* Right: record the outcome */}
        <aside aria-label="Record the outcome" className="lg:sticky lg:top-4 lg:self-start">
          {closed ? (
            <Card className="p-4">
              <h2 className="text-base font-semibold">Outcome recorded</h2>
              {recorded ? (
                <>
                  <p className="mt-2">
                    <Chip tone="good">{OUTCOMES[recorded.code].label}</Chip>{" "}
                    <span className="text-xs text-muted">{fmtTime(recorded.at)} · by {nameOf(recorded.by)}</span>
                  </p>
                  {recorded.note && <p className="mt-2 text-sm">{recorded.note}</p>}
                  {recorded.scheduledFor && <p className="mt-1 text-sm">Target: {recorded.scheduledFor}</p>}
                  <div className="mt-3 rounded-md border border-line">
                    <p className="border-b border-line px-2 py-1.5 text-xs font-semibold">What the resident sees</p>
                    {Array.from(new Set<Locale>(["en", defaultLocale])).map((loc) => (
                      <p key={loc} lang={loc} className="px-3 py-2 text-sm">
                        <span className="mr-1 text-[11px] text-muted">{localeLabel(loc)}:</span>
                        {fillTemplate(outcomeTemplate(recorded.code, loc), {
                          date: recorded.scheduledFor ?? (recorded.code === "FIXED" ? fmtDay(recorded.at) : undefined),
                          owner: recorded.newOwnerId ? nameOf(recorded.newOwnerId) : undefined,
                          note: recorded.note,
                          contact: recorded.note,
                        })}
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">This packet is {a.state}.</p>
              )}
            </Card>
          ) : (
            <OutcomePanel
              assignmentId={a.id}
              entityId={a.entityId}
              outcomes={outcomeOptions}
              owners={owners}
              locales={locales}
              defaultLocale={defaultLocale}
              templates={templates}
              today={todayNY()}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
