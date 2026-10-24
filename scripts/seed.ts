// Seed + demo reset: rebuilds schema v2 from the 30-day Open311 snapshot.
// npm run seed  (tsx --env-file=.env.local scripts/seed.ts). Safe to rerun.

import { readFileSync } from "node:fs";
import type postgres from "postgres";
import { join } from "node:path";
import type { Assignment, Problem, Report } from "@/core/types";
import { entityById, familyOf, loadEntities, NOT_ROUTED } from "@/core/entities";
import { parseReportText } from "@/core/language";
import { cluster } from "@/ledger/cluster";
import { route } from "@/core/routing/route";
import { priority } from "@/core/priority";
import { buildAssignment } from "@/workflow/assign";
import { assignmentRow, problemRow, reportRow } from "@/db/repo";
import { makeSql } from "./lib/db";
import { nearestOwner } from "./lib/roads";

const SNAPSHOT = join(process.cwd(), "research/open311/boston-open311-2026-09-24_to_2026-10-24.json");
const SCHEMA = join(process.cwd(), "db/schema.sql");
const BATCH = 1000;

interface RawRecord {
  service_request_id: string;
  service_name: string;
  status?: "open" | "closed";
  status_notes?: string;
  description?: string;
  requested_datetime: string;
  address?: string;
  lat?: number;
  long?: number;
  media_url?: string;
  extended_attributes?: { photos?: { media_url?: string }[] };
}

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

function cleanNotes(html?: string): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|#39|[a-z]+);/gi, (m, e: string) =>
      ENTITIES[e.toLowerCase()] ?? (e.startsWith("#") ? String.fromCharCode(Number(e.slice(1))) : m),
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return text || undefined;
}

function normalize(r: RawRecord): Report | undefined {
  if (typeof r.lat !== "number" || typeof r.long !== "number") return undefined;
  const parsed = parseReportText(r.description ?? "");
  const media = [r.media_url, ...(r.extended_attributes?.photos ?? []).map((p) => p.media_url)].filter(
    (u): u is string => typeof u === "string" && u.length > 0,
  );
  return {
    id: r.service_request_id,
    source: "open311",
    serviceName: r.service_name,
    serviceFamily: familyOf(r.service_name),
    description: parsed.text || undefined,
    originalText: parsed.originalText || undefined,
    preferredLanguage: parsed.preferredLanguage || "en",
    lat: r.lat,
    lon: r.long,
    address: r.address ?? "",
    mediaUrls: [...new Set(media)],
    requestedAt: new Date(r.requested_datetime).toISOString(),
    cityStatus: r.status,
    cityStatusNotes: cleanNotes(r.status_notes),
  };
}

const newest = (rs: Report[]) => rs.reduce((a, b) => (b.requestedAt > a.requestedAt ? b : a));

function mostCommon(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  for (const [v, n] of counts) if (!best || n > counts.get(best)!) best = v;
  return best;
}

async function insertBatches(sql: ReturnType<typeof makeSql>, table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await sql`insert into ${sql("v2." + table)} ${sql(rows.slice(i, i + BATCH) as Record<string, unknown>[])}`;
  }
}

async function main() {
  const t0 = Date.now();
  const NOW = new Date();
  const sql = makeSql();

  // a. schema
  await sql.unsafe(readFileSync(SCHEMA, "utf8"));

  // b. normalize
  const raw = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as RawRecord[];
  const all = raw.map(normalize).filter((r): r is Report => r !== undefined);
  const skipped = raw.length - all.length;

  // c. road owner for routable reports
  const routableAll = all.filter((r) => r.serviceFamily !== NOT_ROUTED);
  let withSegment = 0;
  for (const r of routableAll) {
    const owner = nearestOwner(r.lat, r.lon);
    if (!owner) continue;
    r.roadSegmentId = owner.roadSegmentId;
    r.jurisdictionCode = owner.jurisdictionCode;
    r.roadName = owner.roadName;
    withSegment++;
  }

  // f. replay queue, held back before clustering
  const queued: { label: string; report: Report }[] = [];
  // A DCR parkway segment with repeat reports in a family DCR owns, so that after
  // DCR answers NOT_OURS the replayed report lands on the learned owner. Morrissey
  // Blvd first when it has such a group, then potholes, then the biggest group.
  const dcrOwns = new Set(loadEntities().find((e) => e.id === "dcr")?.owns ?? []);
  const groups = new Map<string, Report[]>();
  for (const r of routableAll) {
    if (r.jurisdictionCode !== "3" || !r.roadSegmentId || !dcrOwns.has(r.serviceFamily)) continue;
    const key = `${r.serviceFamily}|${r.roadSegmentId}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const score = (g: Report[]) =>
    (g.length >= 2 ? 100 : 0) +
    (/morrissey/i.test(g[0].roadName ?? "") ? 20 : 0) +
    (g[0].serviceFamily === "pothole" ? 10 : 0) +
    g.length;
  const biggest = [...groups.values()].sort((a, b) => score(b) - score(a))[0];
  if (biggest) queued.push({ label: "dcr-parkway", report: newest(biggest) });
  const metro = routableAll.filter(
    (r) => r.serviceFamily === "signal" && /metropolitan ave/i.test(r.address) && /poplar/i.test(r.address),
  );
  if (metro.length > 0) queued.push({ label: "metropolitan-signal", report: newest(metro) });
  const heldIds = new Set(queued.map((q) => q.report.id));
  const reports = all.filter((r) => !heldIds.has(r.id));
  const routable = routableAll.filter((r) => !heldIds.has(r.id));

  // d. cluster
  const problems: Problem[] = cluster(routable);
  const byId = new Map(routable.map((r) => [r.id, r]));
  const reportsOf = (p: Problem) =>
    p.reportIds.map((id) => byId.get(id)).filter((r): r is Report => r !== undefined)
      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  for (const p of problems) {
    const rs = reportsOf(p);
    const seg = mostCommon(rs.map((r) => r.roadSegmentId));
    const segReport = rs.find((r) => r.roadSegmentId === seg);
    p.roadSegmentId = seg;
    p.roadName = segReport?.roadName;
    p.jurisdictionCode = segReport?.jurisdictionCode;
    p.address = rs[0]?.address ?? p.address;
  }

  // e. route, prioritize, dispatch
  const entities = loadEntities();
  const assignments: Assignment[] = [];
  const byEntity = new Map<string, number>();
  for (const p of problems) {
    const decision = route(p, { entities, overrides: [], reports: reportsOf(p) });
    p.priority = priority(p, entityById(decision.entityId), NOW);
    p.status = decision.entityId === "triage" ? "new" : "routed";
    assignments.push(buildAssignment(p, decision, entities, 1, new Date(p.firstReportedAt)));
    byEntity.set(decision.entityId, (byEntity.get(decision.entityId) ?? 0) + 1);
  }

  // g. insert
  await insertBatches(sql, "problems", problems.map((p) => problemRow(sql, p)));
  await insertBatches(sql, "reports", reports.map((r) => reportRow(sql, r)));
  await insertBatches(sql, "assignments", assignments.map(assignmentRow));
  for (const q of queued) {
    await sql`insert into v2.replay_queue (label, payload) values (${q.label}, ${sql.json(q.report as unknown as postgres.JSONValue)})`;
  }
  await sql.end();

  const triage = byEntity.get("triage") ?? 0;
  console.log("Replay queued:");
  for (const q of queued)
    console.log(`  ${q.label}: ${q.report.id} · ${q.report.address} · ${q.report.roadName ?? "-"} · J${q.report.jurisdictionCode ?? "-"}`);
  console.log(`reports       ${reports.length} (skipped ${skipped} without coordinates)`);
  console.log(`routable      ${routable.length}`);
  console.log(`with segment  ${withSegment} of ${routableAll.length}`);
  console.log(`problems      ${problems.length}`);
  console.log(`routed        ${problems.length - triage}`);
  console.log(`triage        ${triage}`);
  console.log("by entity:");
  for (const [id, n] of [...byEntity].sort((a, b) => b[1] - a[1])) console.log(`  ${id.padEnd(22)} ${n}`);
  console.log(`replay queued ${queued.length}`);
  console.log(`elapsed       ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
