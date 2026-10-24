import type postgres from "postgres";
import type {
  Assignment,
  EntityCounts,
  HistoryEvent,
  InboxFilter,
  InboxItem,
  Outcome,
  Overview,
  Packet,
  Problem,
  Report,
  Repo,
  RoutingOverride,
  ScorecardRow,
} from "@/core/types";
import { TRIAGE_ID } from "@/core/types";
import { getSql } from "@/db/client";
import { entityName, loadEntities, NOT_ROUTED } from "@/core/entities";
import { haversineMeters } from "@/ledger/geo";

// Postgres-backed Repo. Tables live in schema v2 (db/schema.sql) and every query
// is schema-qualified. Columns are snake_case; the mappers below convert rows to
// the camelCase contract types in src/core/types.ts.

type Row = postgres.Row;

const OPEN_STATES = ["sent", "acknowledged", "in_progress"];
const FAMILIES = ["streetlight", "pothole", "sidewalk", "tree", "signal", "sign", "wire"];

const iso = (d: unknown): string => new Date(d as string | Date).toISOString();
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const optIso = (d: unknown): string | undefined => (d == null ? undefined : iso(d));

export function toReport(r: Row): Report {
  return {
    id: r.id,
    source: r.source,
    serviceName: r.service_name,
    serviceFamily: r.service_family,
    description: opt(r.description),
    originalText: opt(r.original_text),
    lat: Number(r.lat),
    lon: Number(r.lon),
    address: r.address,
    mediaUrls: r.media_urls ?? [],
    requestedAt: iso(r.requested_at),
    cityStatus: opt(r.city_status),
    cityStatusNotes: opt(r.city_status_notes),
    problemId: opt(r.problem_id),
    preferredLanguage: r.preferred_language ?? "en",
    roadSegmentId: opt(r.road_segment_id),
    jurisdictionCode: opt(r.jurisdiction_code),
    roadName: opt(r.road_name),
  };
}

export function toProblem(r: Row, reportIds: string[] = []): Problem {
  return {
    id: r.id,
    serviceFamily: r.service_family,
    lat: Number(r.lat),
    lon: Number(r.lon),
    address: r.address,
    roadSegmentId: opt(r.road_segment_id),
    roadName: opt(r.road_name),
    jurisdictionCode: opt(r.jurisdiction_code),
    reportIds,
    reporterCount: Number(r.reporter_count),
    firstReportedAt: iso(r.first_reported_at),
    lastReportedAt: iso(r.last_reported_at),
    status: r.status,
    priority: r.priority,
  };
}

export function toAssignment(r: Row): Assignment {
  return {
    id: r.id,
    problemId: r.problem_id,
    entityId: r.entity_id,
    attempt: Number(r.attempt),
    sentAt: iso(r.sent_at),
    respondBy: iso(r.respond_by),
    resolveBy: iso(r.resolve_by),
    routingReason: r.routing_reason,
    confidence: r.confidence,
    state: r.state,
  };
}

export function toOutcome(r: Row): Outcome {
  return {
    id: r.id,
    assignmentId: r.assignment_id,
    code: r.code,
    note: opt(r.note),
    photoUrl: opt(r.photo_url),
    scheduledFor: opt(r.scheduled_for),
    newOwnerId: opt(r.new_owner_id),
    by: r.by_who,
    at: iso(r.at),
  };
}

export function toOverride(r: Row): RoutingOverride {
  return {
    id: r.id,
    serviceFamily: r.service_family,
    roadSegmentId: opt(r.road_segment_id),
    areaKey: opt(r.area_key),
    entityId: r.entity_id,
    learnedFrom: r.learned_from,
    learnedFromEntityId: r.learned_from_entity_id,
    createdAt: iso(r.created_at),
  };
}

// type → row (used by the repo writes and the seed's batch inserts).
// jsonb values go through sql.json: a plain JSON string would be stored as a
// jsonb string scalar, and a raw JS array would be sent as a Postgres array.
const asJson = (sql: postgres.Sql, v: unknown) => sql.json(v as postgres.JSONValue);

export function reportRow(sql: postgres.Sql, r: Report) {
  return {
    id: r.id,
    source: r.source,
    service_name: r.serviceName,
    service_family: r.serviceFamily,
    description: r.description ?? null,
    original_text: r.originalText ?? null,
    lat: r.lat,
    lon: r.lon,
    address: r.address ?? "",
    media_urls: asJson(sql, r.mediaUrls ?? []),
    requested_at: r.requestedAt,
    city_status: r.cityStatus ?? null,
    city_status_notes: r.cityStatusNotes ?? null,
    preferred_language: r.preferredLanguage ?? "en",
    road_segment_id: r.roadSegmentId ?? null,
    jurisdiction_code: r.jurisdictionCode ?? null,
    road_name: r.roadName ?? null,
    problem_id: r.problemId ?? null,
  };
}

export function problemRow(sql: postgres.Sql, p: Problem) {
  return {
    id: p.id,
    service_family: p.serviceFamily,
    lat: p.lat,
    lon: p.lon,
    address: p.address ?? "",
    road_segment_id: p.roadSegmentId ?? null,
    road_name: p.roadName ?? null,
    jurisdiction_code: p.jurisdictionCode ?? null,
    reporter_count: p.reporterCount,
    first_reported_at: p.firstReportedAt,
    last_reported_at: p.lastReportedAt,
    status: p.status,
    priority: asJson(sql, p.priority),
  };
}

export function assignmentRow(a: Assignment) {
  return {
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
  };
}

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

/** SET object from a patch: defined keys only, snake_cased, jsonb as JSON text. */
function patchRow(sql: postgres.Sql, patch: object, skip: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || skip.includes(k)) continue;
    out[snake(k)] = k === "priority" ? asJson(sql, v) : v;
  }
  return out;
}

export class PostgresRepo implements Repo {
  constructor(private sql: postgres.Sql = getSql()) {}

  private async reportIdsFor(problemIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (problemIds.length === 0) return map;
    const rows = await this.sql`
      select problem_id, array_agg(id order by requested_at) ids
      from v2.reports where problem_id in ${this.sql(problemIds)} group by problem_id`;
    for (const r of rows) map.set(r.problem_id, r.ids);
    return map;
  }

  async overview(): Promise<Overview> {
    const sql = this.sql;
    const [[totals], byDay, families, entityRows, clusters, overrides] = await Promise.all([
      sql`
        select
          (select count(*)::int from v2.reports) total_reports,
          (select count(*)::int from v2.reports where service_family <> ${NOT_ROUTED}) routable_reports,
          (select count(*)::int from v2.problems) total_problems,
          (select count(distinct problem_id)::int from v2.assignments
             where entity_id = ${TRIAGE_ID} and state in ${sql(OPEN_STATES)}) triage_problems,
          (select count(*)::int from v2.reports where coalesce(city_status_notes, '') <> '') notes,
          (select count(*)::int from v2.reports where city_status_notes ilike 'noted%') noted,
          (select count(*)::int from v2.outcomes) outcomes,
          (select count(*)::int from v2.replay_queue) replay`,
      sql`
        select to_char((requested_at at time zone 'UTC')::date, 'YYYY-MM-DD') as day, count(*)::int as count
        from v2.reports group by 1 order by 1`,
      sql`
        select f.family,
          (select count(*)::int from v2.reports r where r.service_family = f.family) reports,
          (select count(*)::int from v2.problems p where p.service_family = f.family) problems
        from unnest(${FAMILIES}::text[]) f(family)`,
      sql`
        select a.entity_id,
          count(*)::int open,
          count(*) filter (where a.state = 'sent' and a.respond_by < now())::int overdue,
          count(*) filter (where exists (
            select 1 from v2.reports r where r.problem_id = a.problem_id and r.preferred_language <> 'en'))::int non_english
        from v2.assignments a where a.state in ${sql(OPEN_STATES)} group by a.entity_id`,
      sql`
        select p.id, p.service_family, p.address, p.reporter_count, a.entity_id, a.id assignment_id,
          (select r.city_status_notes from v2.reports r
             where r.problem_id = p.id and coalesce(r.city_status_notes, '') <> ''
             order by r.requested_at limit 1) city_note
        from v2.problems p
        join lateral (select id, entity_id from v2.assignments
                      where problem_id = p.id and state in ${sql(OPEN_STATES)}
                      order by attempt desc limit 1) a on true
        order by p.reporter_count desc, p.last_reported_at desc limit 8`,
      sql`select * from v2.routing_overrides order by created_at desc`,
    ]);

    const byEntity = new Map(entityRows.map((r) => [r.entity_id as string, r]));
    const ids = [...loadEntities().map((e) => e.id), TRIAGE_ID];
    const entities: EntityCounts[] = ids.map((entityId) => {
      const r = byEntity.get(entityId);
      return { entityId, open: r?.open ?? 0, overdue: r?.overdue ?? 0, nonEnglish: r?.non_english ?? 0 };
    });
    const routable = totals.routable_reports as number;
    const problems = totals.total_problems as number;

    return {
      totalReports: totals.total_reports,
      routableReports: routable,
      totalProblems: problems,
      routedProblems: problems - totals.triage_problems,
      triageProblems: totals.triage_problems,
      duplicateShare: routable ? (routable - problems) / routable : 0,
      cityNotedShare: totals.notes ? totals.noted / totals.notes : 0,
      reportsByDay: byDay.map((r) => ({ day: r.day, count: r.count })),
      byFamily: families.map((r) => ({ family: r.family, reports: r.reports, problems: r.problems })),
      entities,
      topClusters: clusters.map((r) => ({
        problemId: r.id,
        serviceFamily: r.service_family,
        address: r.address,
        reporterCount: r.reporter_count,
        entityId: r.entity_id,
        assignmentId: r.assignment_id,
        cityNoteBefore: opt(r.city_note),
      })),
      learnedRules: overrides.map(toOverride),
      outcomesRecorded: totals.outcomes,
      replayRemaining: totals.replay,
    };
  }

  async listInbox(entityId: string, limit = 50, filter: InboxFilter = {}): Promise<InboxItem[]> {
    const sql = this.sql;
    const rows = await sql`
      select to_jsonb(a) a, to_jsonb(p) p
      from v2.assignments a join v2.problems p on p.id = a.problem_id
      where a.entity_id = ${entityId} and a.state in ${sql(OPEN_STATES)}
        ${filter.nonEnglish ? sql`and exists (select 1 from v2.reports r where r.problem_id = p.id and r.preferred_language <> 'en')` : sql``}
      order by (p.priority->>'score')::float desc nulls last, p.last_reported_at desc
      limit ${limit}`;
    if (rows.length === 0) return [];
    const lead = await sql`
      select problem_id,
        array_agg(id order by requested_at) ids,
        (array_agg(description order by requested_at) filter (where coalesce(description, '') <> ''))[1] description,
        (array_agg(media_urls->>0 order by requested_at) filter (where jsonb_array_length(media_urls) > 0))[1] first_photo,
        sum(jsonb_array_length(media_urls))::int photo_count,
        array_agg(distinct preferred_language) langs
      from v2.reports where problem_id in ${sql(rows.map((r) => r.p.id as string))}
      group by problem_id`;
    const byProblem = new Map(lead.map((r) => [r.problem_id as string, r]));
    const now = Date.now();
    return rows.map((r, i) => {
      const assignment = toAssignment(r.a);
      const l = byProblem.get(r.p.id);
      return {
        rank: i + 1,
        assignment,
        problem: toProblem(r.p, l?.ids ?? []),
        description: opt(l?.description),
        photoCount: l?.photo_count ?? 0,
        firstPhotoUrl: opt(l?.first_photo),
        reporterLanguages: l?.langs ?? [],
        overdue: assignment.state === "sent" && Date.parse(assignment.respondBy) < now,
      };
    });
  }

  async getPacket(assignmentId: string): Promise<Packet | undefined> {
    const sql = this.sql;
    const [a] = await sql`select * from v2.assignments where id = ${assignmentId}`;
    if (!a) return undefined;
    const [[p], reportRows, assignmentRows] = await Promise.all([
      sql`select * from v2.problems where id = ${a.problem_id}`,
      sql`select * from v2.reports where problem_id = ${a.problem_id} order by requested_at`,
      sql`select * from v2.assignments where problem_id = ${a.problem_id} order by sent_at, attempt`,
    ]);
    if (!p) return undefined;
    const outcomeRows = await sql`
      select * from v2.outcomes where assignment_id in ${sql(assignmentRows.map((r) => r.id as string))}
      order by at`;

    const reports = reportRows.map(toReport);
    const assignments = assignmentRows.map(toAssignment);
    const outcomes = outcomeRows.map(toOutcome);
    const ownerOf = new Map(assignments.map((x) => [x.id, x.entityId]));

    const history: HistoryEvent[] = [
      ...reports.map((r): HistoryEvent => ({
        at: r.requestedAt,
        kind: "report",
        text: `Reported by a resident via 311${r.description ? ` · ${r.description.slice(0, 80)}` : ""}`,
      })),
      ...assignments.map((x): HistoryEvent => ({
        at: x.sentAt,
        kind: "assignment",
        text: `Sent to ${entityName(x.entityId)} · ${x.routingReason}`,
        entityId: x.entityId,
        confidence: x.confidence,
      })),
      ...outcomes.map((o): HistoryEvent => {
        const entityId = ownerOf.get(o.assignmentId);
        return {
          at: o.at,
          kind: "outcome",
          text: `${entityId ? entityName(entityId) : o.by}: ${o.code}${o.note ? " · " + o.note : ""}`,
          entityId,
          code: o.code,
        };
      }),
    ].sort((x, y) => Date.parse(x.at) - Date.parse(y.at));

    return {
      assignment: toAssignment(a),
      problem: toProblem(p, reports.map((r) => r.id)),
      reports,
      history,
      outcomes,
      missing: [],
    };
  }

  async getProblem(problemId: string): Promise<Problem | undefined> {
    const [p] = await this.sql`select * from v2.problems where id = ${problemId}`;
    if (!p) return undefined;
    return toProblem(p, (await this.reportIdsFor([problemId])).get(problemId) ?? []);
  }

  async getAssignment(assignmentId: string): Promise<Assignment | undefined> {
    const [a] = await this.sql`select * from v2.assignments where id = ${assignmentId}`;
    return a ? toAssignment(a) : undefined;
  }

  async listReports(problemId: string): Promise<Report[]> {
    const rows = await this.sql`select * from v2.reports where problem_id = ${problemId} order by requested_at`;
    return rows.map(toReport);
  }

  async listOverrides(): Promise<RoutingOverride[]> {
    const rows = await this.sql`select * from v2.routing_overrides order by created_at desc`;
    return rows.map(toOverride);
  }

  async scorecard(): Promise<ScorecardRow[]> {
    const sql = this.sql;
    const [counts, answers] = await Promise.all([
      sql`
        select entity_id,
          count(*) filter (where state in ${sql(OPEN_STATES)})::int open,
          count(*) filter (where state = 'sent' and respond_by < now())::int overdue
        from v2.assignments group by entity_id`,
      sql`
        select a.entity_id,
          count(*)::int answered,
          count(*) filter (where o.code = 'FIXED')::int fixed,
          count(*) filter (where o.code = 'NOT_OURS')::int rerouted,
          count(*) filter (where o.code = 'NOT_FOUND')::int not_found,
          count(*) filter (where o.code = 'DEFERRED_CAPITAL')::int deferred,
          percentile_cont(0.5) within group (order by extract(epoch from o.at - a.sent_at) / 3600) median_hours
        from v2.outcomes o join v2.assignments a on a.id = o.assignment_id group by a.entity_id`,
    ]);
    const c = new Map(counts.map((r) => [r.entity_id as string, r]));
    const o = new Map(answers.map((r) => [r.entity_id as string, r]));
    return [...loadEntities().map((e) => e.id), TRIAGE_ID].map((entityId) => {
      const cr = c.get(entityId);
      const or = o.get(entityId);
      return {
        entityId,
        open: cr?.open ?? 0,
        overdue: cr?.overdue ?? 0,
        answered: or?.answered ?? 0,
        fixed: or?.fixed ?? 0,
        rerouted: or?.rerouted ?? 0,
        notFound: or?.not_found ?? 0,
        deferred: or?.deferred ?? 0,
        reopenRate: 0,
        medianResponseHours: or?.median_hours == null ? undefined : Number(or.median_hours),
      };
    });
  }

  async listOpenProblemsNear(lat: number, lon: number, serviceFamily: string, meters: number): Promise<Problem[]> {
    const dLat = meters / 111_320;
    const dLon = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
    const rows = await this.sql`
      select * from v2.problems
      where service_family = ${serviceFamily}
        and status not in ('resolved', 'not_actionable')
        and lat between ${lat - dLat} and ${lat + dLat}
        and lon between ${lon - dLon} and ${lon + dLon}`;
    const near = rows.filter((r) => haversineMeters(lat, lon, Number(r.lat), Number(r.lon)) <= meters);
    const ids = await this.reportIdsFor(near.map((r) => r.id as string));
    return near.map((r) => toProblem(r, ids.get(r.id) ?? []));
  }

  async createAssignment(assignment: Assignment): Promise<void> {
    await this.sql`insert into v2.assignments ${this.sql(assignmentRow(assignment))}`;
  }

  async updateAssignment(assignmentId: string, patch: Partial<Assignment>): Promise<void> {
    const set = patchRow(this.sql, patch, ["id"]);
    if (Object.keys(set).length === 0) return;
    await this.sql`update v2.assignments set ${this.sql(set)} where id = ${assignmentId}`;
  }

  async updateProblem(problemId: string, patch: Partial<Problem>): Promise<void> {
    const set = patchRow(this.sql, patch, ["id", "reportIds"]);
    if (Object.keys(set).length === 0) return;
    await this.sql`update v2.problems set ${this.sql(set)} where id = ${problemId}`;
  }

  async recordOutcome(o: Outcome): Promise<void> {
    await this.sql`insert into v2.outcomes ${this.sql({
      id: o.id,
      assignment_id: o.assignmentId,
      code: o.code,
      note: o.note ?? null,
      photo_url: o.photoUrl ?? null,
      scheduled_for: o.scheduledFor ?? null,
      new_owner_id: o.newOwnerId ?? null,
      by_who: o.by,
      at: o.at,
    })}`;
  }

  async addOverride(o: RoutingOverride): Promise<void> {
    await this.sql`insert into v2.routing_overrides ${this.sql({
      id: o.id,
      service_family: o.serviceFamily,
      road_segment_id: o.roadSegmentId ?? null,
      area_key: o.areaKey ?? null,
      entity_id: o.entityId,
      learned_from: o.learnedFrom,
      learned_from_entity_id: o.learnedFromEntityId,
      created_at: o.createdAt,
    })}`;
  }

  async attachReport(report: Report, problem: Problem): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`insert into v2.reports ${tx(reportRow(this.sql, { ...report, problemId: problem.id }))}`;
      await tx`
        update v2.problems set
          reporter_count = (select count(*)::int from v2.reports where problem_id = ${problem.id}),
          last_reported_at = greatest(last_reported_at, ${report.requestedAt}::timestamptz),
          priority = coalesce(${problem.priority ? asJson(this.sql, problem.priority) : null}, priority)
        where id = ${problem.id}`;
    });
  }

  async createProblem(problem: Problem): Promise<void> {
    await this.sql`insert into v2.problems ${this.sql(problemRow(this.sql, problem))}`;
  }

  async nextReplayReport(): Promise<Report | undefined> {
    const [row] = await this.sql`
      delete from v2.replay_queue where id = (select min(id) from v2.replay_queue) returning payload`;
    return row ? (row.payload as Report) : undefined;
  }
}
