import type {
  Assignment,
  AssignmentState,
  Outcome,
  Priority,
  Problem,
  ProblemStatus,
  Report,
  Repo,
  RoutingConfidence,
  RoutingOverride,
  ScorecardRow,
} from "@/core/types";
import { getSql } from "@/db/client";
import { loadEntities } from "@/core/entities";
import { route } from "@/core/routing/route";
import { priority } from "@/core/priority";
import { addReport } from "@/ledger/cluster";

// Postgres-backed Repo (build-plan §2, PLAYBOOK §2). Column names are snake_case;
// row mappers convert to the camelCase types. Created with prepare:false via the
// shared client.

type Sql = ReturnType<typeof getSql>;

export interface ProblemRow {
  id: string;
  service_family: string;
  lat: number;
  lon: number;
  road_segment_id: string | null;
  neighborhood: string;
  block_group_id: string | null;
  ej_criteria: string | null;
  limited_english_pct: number | null;
  reporter_count: number;
  first_reported_at: Date;
  last_reported_at: Date;
  status: ProblemStatus;
  jurisdiction_code: string | null;
  priority: Priority;
}

export interface AssignmentRow {
  id: string;
  problem_id: string;
  entity_id: string;
  attempt: number;
  sent_at: Date;
  respond_by: Date;
  resolve_by: Date;
  routing_reason: string;
  confidence: RoutingConfidence;
  state: AssignmentState;
}

export interface ReportRow {
  id: string;
  source: string;
  service_name: string;
  description: string | null;
  lat: number;
  lon: number;
  address: string;
  media_url: string | null;
  requested_at: Date;
  preferred_language: string | null;
  problem_id: string | null;
}

interface OverrideRow {
  service_family: string;
  road_segment_id: string | null;
  area_key: string | null;
  entity_id: string;
  learned_from: string;
  created_at: Date;
}

function iso(d: Date | string): string {
  return typeof d === "string" ? d : d.toISOString();
}

export function toProblem(r: ProblemRow): Problem {
  return {
    id: r.id,
    serviceFamily: r.service_family,
    lat: r.lat,
    lon: r.lon,
    roadSegmentId: r.road_segment_id ?? undefined,
    neighborhood: r.neighborhood,
    blockGroupId: r.block_group_id ?? undefined,
    ejCriteria: r.ej_criteria ?? undefined,
    limitedEnglishPct: r.limited_english_pct ?? undefined,
    reportIds: [],
    reporterCount: r.reporter_count,
    firstReportedAt: iso(r.first_reported_at),
    lastReportedAt: iso(r.last_reported_at),
    status: r.status,
    jurisdictionCode: r.jurisdiction_code ?? undefined,
    priority: r.priority,
  };
}

export function toAssignment(r: AssignmentRow): Assignment {
  return {
    id: r.id,
    problemId: r.problem_id,
    entityId: r.entity_id,
    attempt: r.attempt,
    sentAt: iso(r.sent_at),
    respondBy: iso(r.respond_by),
    resolveBy: iso(r.resolve_by),
    routingReason: r.routing_reason,
    confidence: r.confidence,
    state: r.state,
  };
}

export function toReport(r: ReportRow): Report {
  return {
    id: r.id,
    source: r.source as Report["source"],
    serviceName: r.service_name,
    description: r.description ?? undefined,
    lat: r.lat,
    lon: r.lon,
    address: r.address,
    mediaUrl: r.media_url ?? undefined,
    requestedAt: iso(r.requested_at),
    preferredLanguage: r.preferred_language ?? undefined,
    problemId: r.problem_id ?? undefined,
  };
}

function toOverride(r: OverrideRow): RoutingOverride {
  return {
    serviceFamily: r.service_family,
    roadSegmentId: r.road_segment_id ?? undefined,
    areaKey: r.area_key ?? undefined,
    entityId: r.entity_id,
    learnedFrom: r.learned_from,
    createdAt: iso(r.created_at),
  };
}

export class PostgresRepo implements Repo {
  private sql: Sql;

  constructor(sql: Sql = getSql()) {
    this.sql = sql;
  }

  async listInbox(entityId: string): Promise<Assignment[]> {
    const rows = await this.sql<AssignmentRow[]>`
      select * from assignments
      where entity_id = ${entityId} and state not in ('closed', 'rerouted')
      order by sent_at desc`;
    return rows.map(toAssignment);
  }

  async getProblem(problemId: string): Promise<Problem | undefined> {
    const [row] = await this.sql<ProblemRow[]>`
      select * from problems where id = ${problemId}`;
    if (!row) return undefined;
    const problem = toProblem(row);
    const members = await this.sql<{ report_id: string }[]>`
      select report_id from problem_reports where problem_id = ${problemId}`;
    problem.reportIds = members.map((m) => m.report_id);
    return problem;
  }

  async recordOutcome(outcome: Outcome): Promise<void> {
    await this.sql`
      insert into outcomes (id, assignment_id, code, note, photo_url, scheduled_for, by_who, at)
      values (${outcome.id}, ${outcome.assignmentId}, ${outcome.code},
              ${outcome.note ?? null}, ${outcome.photoUrl ?? null},
              ${outcome.scheduledFor ?? null}, ${outcome.by}, ${outcome.at})`;
  }

  async createAssignment(a: Assignment): Promise<void> {
    await this.sql`
      insert into assignments (id, problem_id, entity_id, attempt, sent_at, respond_by,
                               resolve_by, routing_reason, confidence, state)
      values (${a.id}, ${a.problemId}, ${a.entityId}, ${a.attempt}, ${a.sentAt},
              ${a.respondBy}, ${a.resolveBy}, ${a.routingReason}, ${a.confidence}, ${a.state})`;
  }

  async updateAssignment(
    assignmentId: string,
    patch: Partial<Assignment>,
  ): Promise<void> {
    if (patch.state !== undefined) {
      await this.sql`update assignments set state = ${patch.state} where id = ${assignmentId}`;
    }
    if (patch.entityId !== undefined) {
      await this.sql`update assignments set entity_id = ${patch.entityId} where id = ${assignmentId}`;
    }
    if (patch.routingReason !== undefined) {
      await this.sql`update assignments set routing_reason = ${patch.routingReason} where id = ${assignmentId}`;
    }
  }

  async updateProblem(problemId: string, patch: Partial<Problem>): Promise<void> {
    if (patch.status !== undefined) {
      await this.sql`update problems set status = ${patch.status} where id = ${problemId}`;
    }
    if (patch.reporterCount !== undefined) {
      await this.sql`update problems set reporter_count = ${patch.reporterCount} where id = ${problemId}`;
    }
    if (patch.lastReportedAt !== undefined) {
      await this.sql`update problems set last_reported_at = ${patch.lastReportedAt} where id = ${problemId}`;
    }
    if (patch.priority !== undefined) {
      await this.sql`update problems set priority = ${this.sql.json(patch.priority as unknown as Record<string, never>)} where id = ${problemId}`;
    }
  }

  async addOverride(o: RoutingOverride): Promise<void> {
    await this.sql`
      insert into routing_overrides (service_family, road_segment_id, area_key,
                                     entity_id, learned_from, created_at)
      values (${o.serviceFamily}, ${o.roadSegmentId ?? null}, ${o.areaKey ?? null},
              ${o.entityId}, ${o.learnedFrom}, ${o.createdAt})`;
  }

  async listOverrides(): Promise<RoutingOverride[]> {
    const rows = await this.sql<OverrideRow[]>`
      select * from routing_overrides order by created_at`;
    return rows.map(toOverride);
  }

  async scorecard(): Promise<ScorecardRow[]> {
    // Per-entity counts for the overview scorecard (§7). Reroute rate and
    // NOT_FOUND share come from the outcomes recorded against each entity.
    const rows = await this.sql<
      {
        entity_id: string;
        total: number;
        rerouted: number;
        not_found: number;
      }[]
    >`
      select a.entity_id,
             count(*)::int as total,
             count(*) filter (where a.state = 'rerouted')::int as rerouted,
             count(o.id) filter (where o.code = 'NOT_FOUND')::int as not_found
      from assignments a
      left join outcomes o on o.assignment_id = a.id
      group by a.entity_id
      order by total desc`;
    return rows.map((r) => ({
      entityId: r.entity_id,
      rerouteRate: r.total ? r.rerouted / r.total : 0,
      notFoundShare: r.total ? r.not_found / r.total : 0,
    }));
  }

  async ingestReport(report: Report): Promise<Problem> {
    // Insert the raw report, attach it to a nearby open problem of the same
    // family (or start a new one), route + prioritize, and create an assignment.
    const family = report.serviceName;
    void family;

    await this.sql`
      insert into reports (id, source, service_name, service_family, description, lat, lon,
                           address, media_url, requested_at, preferred_language)
      values (${report.id}, ${report.source}, ${report.serviceName},
              ${(await import("@/core/entities")).familyOf(report.serviceName)},
              ${report.description ?? null}, ${report.lat}, ${report.lon},
              ${report.address}, ${report.mediaUrl ?? null}, ${report.requestedAt},
              ${report.preferredLanguage ?? null})
      on conflict (id) do nothing`;

    // Candidate open problems of the same family nearby (coarse bbox prefilter).
    const { familyOf } = await import("@/core/entities");
    const fam = familyOf(report.serviceName);
    const dLat = 0.0005;
    const dLon = 0.0007;
    const nearbyRows = await this.sql<ProblemRow[]>`
      select * from problems
      where service_family = ${fam}
        and status <> 'resolved'
        and lat between ${report.lat - dLat} and ${report.lat + dLat}
        and lon between ${report.lon - dLon} and ${report.lon + dLon}`;
    const nearby = nearbyRows.map(toProblem);

    const problem = addReport(report, nearby);
    const isExisting = nearby.some((p) => p.id === problem.id);

    if (isExisting) {
      await this.sql`
        update problems set reporter_count = ${problem.reporterCount},
                            last_reported_at = ${problem.lastReportedAt}
        where id = ${problem.id}`;
    } else {
      // Inherit the road owner from a sibling problem, if any, so routing by
      // jurisdiction/override still works for the replayed report.
      const [sibling] = await this.sql<ProblemRow[]>`
        select jurisdiction_code, road_segment_id from problems
        where service_family = ${fam} and road_segment_id is not null
          and lat between ${report.lat - dLat} and ${report.lat + dLat}
          and lon between ${report.lon - dLon} and ${report.lon + dLon}
        limit 1`;
      if (sibling) {
        problem.jurisdictionCode = sibling.jurisdiction_code ?? undefined;
        problem.roadSegmentId = sibling.road_segment_id ?? undefined;
      }
      await this.sql`
        insert into problems (id, service_family, lat, lon, road_segment_id, neighborhood,
                              reporter_count, first_reported_at, last_reported_at, status,
                              jurisdiction_code, priority)
        values (${problem.id}, ${problem.serviceFamily}, ${problem.lat}, ${problem.lon},
                ${problem.roadSegmentId ?? null}, ${problem.neighborhood},
                ${problem.reporterCount}, ${problem.firstReportedAt}, ${problem.lastReportedAt},
                ${problem.status}, ${problem.jurisdictionCode ?? null},
                ${this.sql.json(problem.priority as unknown as Record<string, never>)})`;
    }

    await this.sql`
      insert into problem_reports (problem_id, report_id)
      values (${problem.id}, ${report.id}) on conflict do nothing`;
    await this.sql`update reports set problem_id = ${problem.id} where id = ${report.id}`;

    // Route + prioritize, create an assignment for the landing owner.
    const entities = loadEntities();
    const overrides = await this.listOverrides();
    const decision = route(problem, { entities, overrides });
    const owner = entities.find((e) => e.id === decision.entityId);
    // A re-report on a problem that already has an open packet is one more
    // person waiting, not a new packet: don't create a duplicate assignment.
    const [open] = isExisting
      ? await this.sql`
          select 1 from assignments
          where problem_id = ${problem.id} and state not in ('closed', 'rerouted')
          limit 1`
      : [];
    if (owner && !open) {
      const prio = priority(problem, owner, new Date(report.requestedAt));
      await this.sql`update problems set priority = ${this.sql.json(prio as unknown as Record<string, never>)}, status = 'routed' where id = ${problem.id}`;
      problem.priority = prio;
      problem.status = "routed";
      const sentAt = report.requestedAt;
      const respondH = /^(\d+)/.exec(owner.respondWithin ?? "48h");
      const hrs = respondH ? Number(respondH[1]) : 48;
      await this.createAssignment({
        id: `a-${problem.id}-${Date.now()}`,
        problemId: problem.id,
        entityId: decision.entityId,
        attempt: 1,
        sentAt,
        respondBy: new Date(Date.parse(sentAt) + hrs * 3_600_000).toISOString(),
        resolveBy: new Date(Date.parse(sentAt) + hrs * 3_600_000 * 3).toISOString(),
        routingReason: decision.reason,
        confidence: decision.confidence === "triage" ? "rule" : decision.confidence,
        state: "sent",
      });
    }

    return problem;
  }

  async nextReplayReport(): Promise<Report | undefined> {
    const [row] = await this.sql<{ payload: Report }[]>`
      delete from replay_queue
      where id = (select min(id) from replay_queue)
      returning payload`;
    return row?.payload;
  }
}
