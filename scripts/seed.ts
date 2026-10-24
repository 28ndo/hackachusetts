// Offline seed pipeline and demo reset (dispatch-ledger §6).
//   drop/recreate schema → insert every snapshot report (for the counter)
//   → cluster + enrich routable reports → route() + priority() → one assignment
//   per problem → hold back two replay reports. Under 2 minutes, safe to rerun.
//
// Run: npm run seed  (= tsx --env-file=.env.local scripts/seed.ts)
// Uses DATABASE_URL_UNPOOLED when set (direct), else DATABASE_URL.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Assignment, Problem, Report } from "@/core/types";
import { familyOf, loadEntities, NOT_ROUTED } from "@/core/entities";
import { cluster } from "@/ledger/cluster";
import { route } from "@/core/routing/route";
import { priority } from "@/core/priority";
import { makeSql } from "./lib/db.ts";

// A JSON-safe value accepted by postgres' sql.json(); our priority/report
// objects are plain JSON, so round-tripping is both a cast and a clone.
type JsonSafe = Parameters<ReturnType<typeof makeSql>["json"]>[0];
function asJson(value: unknown): JsonSafe {
  return JSON.parse(JSON.stringify(value)) as JsonSafe;
}
import {
  ensureRoads,
  loadFallbackOwners,
  nearestOwner,
  type OwnerResult,
} from "./lib/roads.ts";

const SNAPSHOT = join(
  process.cwd(),
  "research",
  "open311",
  "boston-open311-2026-09-24_to_2026-10-24.json",
);
const NOW = new Date("2026-10-24T18:48:00Z");
const BATCH = 1000;

interface RawRecord {
  service_request_id: string;
  service_name?: string;
  status?: string;
  status_notes?: string;
  description?: string;
  requested_datetime?: string;
  address?: string;
  lat?: number;
  long?: number;
  media_url?: string;
  extended_attributes?: { photos?: { media_url?: string }[] };
}

function normalize(r: RawRecord): Report | undefined {
  const lat = r.lat;
  const lon = r.long;
  if (typeof lat !== "number" || typeof lon !== "number") return undefined;
  if (!r.requested_datetime) return undefined;
  const media =
    r.media_url ?? r.extended_attributes?.photos?.[0]?.media_url ?? undefined;
  return {
    id: r.service_request_id,
    source: "open311",
    serviceName: r.service_name ?? "Other",
    description: r.description || undefined,
    lat,
    lon,
    address: r.address ?? "",
    mediaUrl: media,
    requestedAt: new Date(r.requested_datetime).toISOString(),
  };
}

async function insertReports(
  sql: ReturnType<typeof makeSql>,
  reports: Report[],
): Promise<void> {
  for (let i = 0; i < reports.length; i += BATCH) {
    const chunk = reports.slice(i, i + BATCH).map((r) => ({
      id: r.id,
      source: r.source,
      service_name: r.serviceName,
      service_family: familyOf(r.serviceName),
      description: r.description ?? null,
      lat: r.lat,
      lon: r.lon,
      address: r.address,
      media_url: r.mediaUrl ?? null,
      requested_at: r.requestedAt,
      preferred_language: r.preferredLanguage ?? null,
      problem_id: r.problemId ?? null,
    }));
    await sql`insert into reports ${sql(chunk)}`;
  }
}

function enrich(
  problems: Problem[],
  roads: Awaited<ReturnType<typeof ensureRoads>> | undefined,
  fallback: Map<string, OwnerResult>,
): void {
  for (const p of problems) {
    let owner: OwnerResult | undefined;
    if (roads) owner = nearestOwner(p.lat, p.lon, roads);
    if (!owner) {
      // Try the fallback by any member report id.
      for (const rid of p.reportIds) {
        const f = fallback.get(rid);
        if (f) {
          owner = f;
          break;
        }
      }
    }
    if (owner) {
      p.jurisdictionCode = owner.jurisdictionCode;
      p.roadSegmentId = owner.roadSegmentId;
    }
  }
}

function hoursFromRespondWithin(within: string | undefined, fallbackH = 48): number {
  if (within) {
    const m = /^(\d+(?:\.\d+)?)\s*h/i.exec(within.trim());
    if (m) return Number(m[1]);
  }
  return fallbackH;
}

async function main(): Promise<void> {
  const t0 = Date.now();
  const sql = makeSql();

  // 1. Drop and recreate the schema.
  const ddl = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  await sql.unsafe(ddl);

  // 2. Load the snapshot and insert every report (for the counter).
  const raw = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as RawRecord[];
  const allReports: Report[] = [];
  for (const rec of raw) {
    const n = normalize(rec);
    if (n) allReports.push(n);
  }

  // 3. Routable reports → cluster.
  const routable = allReports.filter(
    (r) => familyOf(r.serviceName) !== NOT_ROUTED,
  );
  const problems = cluster(routable); // sets problemId on routable reports

  await insertReports(sql, allReports);

  // 4. Enrich with road owner (cached geojson, else fallback candidates).
  let roads: Awaited<ReturnType<typeof ensureRoads>> | undefined;
  try {
    roads = await ensureRoads();
  } catch (err) {
    console.warn(
      "road geojson unavailable, using fallback candidates:",
      (err as Error).message,
    );
    roads = undefined;
  }
  const fallback = loadFallbackOwners();
  enrich(problems, roads, fallback);

  // 5. Route + priority → one assignment per problem.
  const entities = loadEntities();
  const assignments: Assignment[] = [];
  for (const p of problems) {
    const decision = route(p, { entities, overrides: [] });
    const owner = entities.find((e) => e.id === decision.entityId);
    const prio = owner ? priority(p, owner, NOW) : p.priority;
    p.priority = prio;
    p.status = decision.entityId === "triage" ? "new" : "routed";

    const respondH = hoursFromRespondWithin(owner?.respondWithin);
    const sentAt = p.lastReportedAt;
    assignments.push({
      id: `a-${p.id}`,
      problemId: p.id,
      entityId: decision.entityId,
      attempt: 1,
      sentAt,
      respondBy: new Date(Date.parse(sentAt) + respondH * 3_600_000).toISOString(),
      resolveBy: new Date(
        Date.parse(sentAt) + respondH * 3_600_000 * 3,
      ).toISOString(),
      routingReason: decision.reason,
      confidence: decision.confidence === "triage" ? "rule" : decision.confidence,
      state: "sent",
    });
  }

  // Write problems, membership, and assignments in batches.
  for (let i = 0; i < problems.length; i += BATCH) {
    const chunk = problems.slice(i, i + BATCH).map((p) => ({
      id: p.id,
      service_family: p.serviceFamily,
      lat: p.lat,
      lon: p.lon,
      road_segment_id: p.roadSegmentId ?? null,
      neighborhood: p.neighborhood ?? "",
      block_group_id: p.blockGroupId ?? null,
      ej_criteria: p.ejCriteria ?? null,
      limited_english_pct: p.limitedEnglishPct ?? null,
      reporter_count: p.reporterCount,
      first_reported_at: p.firstReportedAt,
      last_reported_at: p.lastReportedAt,
      status: p.status,
      jurisdiction_code: p.jurisdictionCode ?? null,
      priority: sql.json(asJson(p.priority)),
    }));
    await sql`insert into problems ${sql(chunk)}`;
  }

  // problem_reports membership + report.problem_id back-reference.
  const membership = problems.flatMap((p) =>
    p.reportIds.map((rid) => ({ problem_id: p.id, report_id: rid })),
  );
  for (let i = 0; i < membership.length; i += BATCH) {
    await sql`insert into problem_reports ${sql(membership.slice(i, i + BATCH))}`;
  }
  for (let i = 0; i < membership.length; i += BATCH) {
    const chunk = membership.slice(i, i + BATCH);
    await sql`
      update reports as r set problem_id = v.problem_id
      from (values ${sql(chunk.map((m) => [m.report_id, m.problem_id]))}) as v(report_id, problem_id)
      where r.id = v.report_id`;
  }

  for (let i = 0; i < assignments.length; i += BATCH) {
    const chunk = assignments.slice(i, i + BATCH).map((a) => ({
      id: a.id,
      problem_id: a.problemId,
      entity_id: a.entityId,
      attempt: a.attempt,
      sent_at: a.sentAt,
      respond_by: a.respondBy,
      resolve_by: a.resolveBy,
      routing_reason: a.routingReason,
      confidence: a.confidence,
      state: a.state,
    }));
    await sql`insert into assignments ${sql(chunk)}`;
  }

  // 6. Hold back the two replay reports.
  await stashReplay(sql, allReports, "morrissey-dcr", (r) =>
    /morrissey/i.test(r.address) && familyOf(r.serviceName) === "streetlight",
  );
  await stashReplay(sql, allReports, "metropolitan-signal", (r) =>
    /metropolitan ave/i.test(r.address) &&
    /poplar/i.test(r.address) &&
    familyOf(r.serviceName) === "signal",
  );

  // 7. Counts.
  const [{ reports }] = await sql<{ reports: number }[]>`select count(*)::int as reports from reports`;
  const [{ probs }] = await sql<{ probs: number }[]>`select count(*)::int as probs from problems`;
  const [{ routed }] = await sql<{ routed: number }[]>`
    select count(*)::int as routed from assignments where entity_id <> 'triage'`;
  const [{ held }] = await sql<{ held: number }[]>`select count(*)::int as held from replay_queue`;

  console.log("seed complete:");
  console.log(`  reports inserted : ${reports}`);
  console.log(`  problems         : ${probs}`);
  console.log(`  routed (assigned): ${routed}`);
  console.log(`  held for replay  : ${held}`);
  console.log(`  elapsed          : ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  await sql.end();
}

async function stashReplay(
  sql: ReturnType<typeof makeSql>,
  reports: Report[],
  label: string,
  pred: (r: Report) => boolean,
): Promise<void> {
  const matches = reports.filter(pred);
  if (matches.length === 0) {
    console.warn(`replay: no report matched "${label}"`);
    return;
  }
  // Newest by requestedAt.
  const newest = matches.reduce((a, b) =>
    Date.parse(b.requestedAt) > Date.parse(a.requestedAt) ? b : a,
  );
  // Replay a fresh copy, not the seeded report itself: a new id, and a time
  // inside the 14-day cluster window (13 days after the original, capped at
  // NOW), so it joins the same problem as one more person waiting instead of
  // re-adding a report that's already there or opening a duplicate packet.
  const replayAt = Math.min(NOW.getTime(), Date.parse(newest.requestedAt) + 13 * 86_400_000);
  const replay: Report = {
    ...newest,
    id: `replay-${newest.id}`,
    requestedAt: new Date(replayAt).toISOString(),
    problemId: undefined,
  };
  await sql`insert into replay_queue ${sql([
    { payload: sql.json(asJson(replay)), label },
  ])}`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
