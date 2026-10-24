import Link from "next/link";
import type { ReactNode } from "react";
import { getRepo } from "@/db/getRepo";
import { loadEntities, familyLabel, etaLine } from "@/core/entities";
import { TRIAGE_ID } from "@/core/types";
import type { EntityCounts } from "@/core/types";
import { Card, Chip, KindBadge, Section } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { fmtDay, num, pct } from "@/components/format";
import { nameOf } from "@/components/names";

export const dynamic = "force-dynamic";

function Hook({ big, line, caption }: { big: string; line: string; caption: string }) {
  return (
    <Card className="p-4">
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{big}</p>
      <p className="mt-1 font-medium">{line}</p>
      <p className="mt-0.5 text-xs text-muted">{caption}</p>
    </Card>
  );
}

function Step({ n, label, sub, strong }: { n: number; label: string; sub?: string; strong?: boolean }) {
  return (
    <div className={`flex-1 rounded-lg border p-3 ${strong ? "border-accent/40 bg-accent-soft" : "border-line bg-surface"}`}>
      <p className={`text-2xl font-semibold tabular-nums ${strong ? "text-accent" : ""}`}>{num(n)}</p>
      <p className="font-medium">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="self-center text-xl text-muted max-sm:rotate-90 max-sm:self-start max-sm:pl-4">
      →
    </span>
  );
}

export default async function OverviewPage() {
  const repo = getRepo();
  const [ov, score] = await Promise.all([repo.overview(), repo.scorecard()]);
  const entities = loadEntities();
  const counts = new Map<string, EntityCounts>(ov.entities.map((c) => [c.entityId, c]));
  const triage = counts.get(TRIAGE_ID);

  return (
    <div>
      {/* Hero */}
      <section aria-labelledby="hero-h">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">Boston 311 · ledger steward view</p>
        <h1 id="hero-h" className="mt-1 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Every report becomes one problem, with one owner and one honest outcome.
        </h1>
        <p className="mt-2 max-w-3xl text-muted">
          We sit between 311 intake and the departments and agencies that do the work: cluster the reports, route each
          problem to its real owner with a reason, and make the owner record a structured outcome instead of “Noted”.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Hook big={pct(ov.cityNotedShare)} line="of the city's closure notes start with “Noted”" caption="no reason, no recorded fix" />
          <Hook big={pct(ov.duplicateShare)} line="of routable reports repeat one already filed" caption="same spot, same problem, within 14 days" />
          <Hook big="3 owners" line="on one boulevard" caption="Morrissey Blvd: DCR, MassDOT and a state college own different segments" />
        </div>
      </section>

      {/* Funnel */}
      <Section id="funnel" title="The firehose, collapsed" kicker="Last 30 days of real Boston 311 reports.">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Step n={ov.totalReports} label="reports" sub="every Open311 request" />
          <Arrow />
          <Step n={ov.routableReports} label="routable" sub="the 7 types we route: potholes, streetlights, sidewalks, trees, signals, signs, wires" />
          <Arrow />
          <Step n={ov.totalProblems} label="problems" sub="clustered by place and type" />
          <Arrow />
          <Step n={ov.routedProblems} label="routed to an owner" sub={`+ ${num(ov.triageProblems)} held for triage`} strong />
        </div>
        <Sparkline data={ov.reportsByDay} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full max-w-xl text-left text-sm">
            <caption className="sr-only">Reports and problems per service family</caption>
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-1.5 pr-3 font-medium">Family</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">Reports</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">Problems</th>
                <th scope="col" className="py-1.5 text-right font-medium">Collapse</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {ov.byFamily.map((f) => (
                <tr key={f.family} className="border-b border-line/60">
                  <th scope="row" className="py-1.5 pr-3 font-normal">{familyLabel(f.family)}</th>
                  <td className="py-1.5 pr-3 text-right">{num(f.reports)}</td>
                  <td className="py-1.5 pr-3 text-right">{num(f.problems)}</td>
                  <td className="py-1.5 text-right text-muted">
                    {f.problems > 0 ? `${(f.reports / f.problems).toFixed(1)} : 1` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Clusters */}
      <Section id="clusters" title="Many reports, one problem" kicker="The city answers each report on its own. The ledger sends one packet.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ov.topClusters.map((c) => (
            <li key={c.problemId}>
              <Link href={`/packet/${c.assignmentId}`} className="block h-full rounded-lg border border-line bg-surface p-4 hover:border-accent">
                <div className="flex items-center justify-between gap-2">
                  <Chip>{familyLabel(c.serviceFamily)}</Chip>
                  <span className="text-xs font-semibold text-accent">{c.reporterCount} people reported this</span>
                </div>
                <p className="mt-2 font-medium">{c.address}</p>
                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="text-muted">
                    <span className="font-medium">Before · </span>City told them:{" "}
                    <q className="italic line-through decoration-muted/50">{c.cityNoteBefore || "nothing"}</q>
                  </p>
                  <p>
                    <span className="font-medium text-good">After · </span>Ledger: one packet, owner{" "}
                    <span className="font-medium">{nameOf(c.entityId)}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Entities */}
      <Section id="owners" title="Owners" kicker="Each owner gets one inbox, ranked by hazard × people × overdue.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => {
            const c = counts.get(e.id);
            return (
              <li key={e.id}>
                <OwnerCard id={e.id} name={e.name} kind={<KindBadge kind={e.kind} />} c={c} eta={etaLine(e)} />
              </li>
            );
          })}
          {triage && triage.open > 0 && (
            <li>
              <OwnerCard id={TRIAGE_ID} name="Ops triage" kind={<KindBadge kind="triage" />} c={triage} eta="No clear owner yet; a person decides." />
            </li>
          )}
        </ul>
      </Section>

      {/* Scorecard */}
      <Section
        id="scorecard"
        title={<>Scorecard · <span className="text-good">0 outcomes recorded as “Noted”</span></>}
        kicker={`${num(ov.outcomesRecorded)} structured outcomes recorded so far. Unlike today's data, every hop and every answer is recorded, so a reroute is not a closure.`}
      >
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Outcomes per owner</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                {["Entity", "Open", "Overdue", "Answered", "Fixed", "Rerouted", "Not found", "Deferred", "Median response (h)"].map((h, i) => (
                  <th key={h} scope="col" className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {score.map((r) => (
                <tr key={r.entityId} className="border-t border-line">
                  <th scope="row" className="px-3 py-2 font-medium">
                    <Link href={`/inbox/${r.entityId}`} className="hover:text-accent">{nameOf(r.entityId)}</Link>
                  </th>
                  <td className="px-3 py-2 text-right">{r.open}</td>
                  <td className={`px-3 py-2 text-right ${r.overdue > 0 ? "font-semibold text-warn" : ""}`}>{r.overdue}</td>
                  <td className="px-3 py-2 text-right">{r.answered}</td>
                  <td className="px-3 py-2 text-right">{r.fixed}</td>
                  <td className="px-3 py-2 text-right">{r.rerouted}</td>
                  <td className="px-3 py-2 text-right">{r.notFound}</td>
                  <td className="px-3 py-2 text-right">{r.deferred}</td>
                  <td className="px-3 py-2 text-right">{r.medianResponseHours === undefined ? "—" : r.medianResponseHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Learned */}
      <Section id="learned" title="What the router has learned" kicker="Every NOT_OURS teaches the router the right owner for that spot.">
        {ov.learnedRules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-4 text-muted">Nothing yet. Tap NOT_OURS in an inbox to teach it.</p>
        ) : (
          <ul className="space-y-2">
            {ov.learnedRules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <Chip tone="good">✓ learned</Chip>
                <span>
                  {familyLabel(r.serviceFamily)} on segment <span className="font-mono text-xs">{r.roadSegmentId ?? r.areaKey}</span> →{" "}
                  <span className="font-medium">{nameOf(r.entityId)}</span>, learned from {nameOf(r.learnedFromEntityId)} on {fmtDay(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function OwnerCard({ id, name, kind, c, eta }: { id: string; name: string; kind: ReactNode; c?: EntityCounts; eta?: string }) {
  const open = c?.open ?? 0;
  const overdue = c?.overdue ?? 0;
  const nonEnglish = c?.nonEnglish ?? 0;
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{name}</h3>
        {kind}
      </div>
      <dl className="mt-3 flex gap-5">
        <div>
          <dt className="text-xs text-muted">Open</dt>
          <dd className="text-xl font-semibold tabular-nums">{open}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Overdue</dt>
          <dd className={`text-xl font-semibold tabular-nums ${overdue > 0 ? "text-warn" : ""}`}>{overdue}</dd>
        </div>
      </dl>
      {nonEnglish > 0 && <p className="mt-2 text-xs text-accent">{nonEnglish} with non-English reporters</p>}
      {eta && <p className="mt-1 text-xs text-muted">{eta}</p>}
      <Link href={`/inbox/${id}`} className="mt-auto pt-3 text-sm font-medium text-accent hover:underline">
        Open inbox →
      </Link>
    </Card>
  );
}
