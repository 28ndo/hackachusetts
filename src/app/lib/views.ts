import type { Assignment, Entity, Problem, Report } from "@/core/types";
import { getRepo } from "@/db/getRepo";
import { getSql } from "@/db/client";
import {
  toAssignment,
  toProblem,
  toReport,
  type AssignmentRow,
  type ProblemRow,
  type ReportRow,
} from "@/db/repo";
import { loadEntities } from "@/core/entities";
import { priority } from "@/core/priority";

// Server-only read models for the inbox UI. Aggregate counts come straight from
// Postgres when a database is configured; per-entity inboxes and packets go
// through getRepo() so the app also runs on fixtureRepo in local dev.

const DEMO_NOW = new Date("2026-10-24T18:48:00Z");

export interface Overview {
  totalReports: number;
  totalProblems: number;
  totalRouted: number;
  entities: { entity: Entity; openCount: number }[];
  hasDatabase: boolean;
}

/** Counts for the "N reports → M problems → K routed" headline and cards. */
export async function getOverview(): Promise<Overview> {
  const entities = loadEntities();
  if (!process.env.DATABASE_URL) {
    // Fixture mode: derive counts from the in-memory repo's inboxes.
    const repo = getRepo();
    const openByEntity = await openCountsFromRepo(entities);
    const totalRouted = [...openByEntity.values()].reduce((a, b) => a + b, 0);
    void repo;
    return {
      totalReports: 20730,
      totalProblems: 8,
      totalRouted,
      entities: entities.map((e) => ({
        entity: e,
        openCount: openByEntity.get(e.id) ?? 0,
      })),
      hasDatabase: false,
    };
  }

  const sql = getSql();
  const [{ reports }] = await sql<{ reports: number }[]>`select count(*)::int as reports from reports`;
  const [{ problems }] = await sql<{ problems: number }[]>`select count(*)::int as problems from problems`;
  const [{ routed }] = await sql<{ routed: number }[]>`
    select count(*)::int as routed from assignments
    where entity_id <> 'triage' and state not in ('closed','rerouted')`;
  const openRows = await sql<{ entity_id: string; n: number }[]>`
    select entity_id, count(*)::int as n from assignments
    where state not in ('closed','rerouted')
    group by entity_id`;
  const openByEntity = new Map(openRows.map((r) => [r.entity_id, r.n]));

  return {
    totalReports: reports,
    totalProblems: problems,
    totalRouted: routed,
    entities: entities.map((e) => ({
      entity: e,
      openCount: openByEntity.get(e.id) ?? 0,
    })),
    hasDatabase: true,
  };
}

async function openCountsFromRepo(entities: Entity[]): Promise<Map<string, number>> {
  const repo = getRepo();
  const counts = new Map<string, number>();
  for (const e of entities) {
    const inbox = await repo.listInbox(e.id);
    counts.set(e.id, inbox.length);
  }
  return counts;
}

export interface RankedItem {
  assignment: Assignment;
  problem: Problem;
  rank: number;
  reports: Report[];
}

/** How many packets an inbox page renders. The header still shows the total. */
export const INBOX_LIMIT = 25;

/**
 * A single entity's inbox, ranked by priority (highest first), top `limit` only.
 * With a database this is three queries in total (assignments, their problems,
 * the top problems' reports) instead of three per packet.
 */
export async function getRankedInbox(
  entityId: string,
  limit = INBOX_LIMIT,
): Promise<{ items: RankedItem[]; total: number }> {
  const entity = loadEntities().find((e) => e.id === entityId);
  const rank = (items: Omit<RankedItem, "rank" | "reports">[]) => {
    for (const it of items) {
      if (entity) it.problem.priority = priority(it.problem, entity, DEMO_NOW);
    }
    items.sort((x, y) => y.problem.priority.score - x.problem.priority.score);
    return items.slice(0, limit);
  };

  if (!process.env.DATABASE_URL) {
    const repo = getRepo();
    const assignments = await repo.listInbox(entityId);
    const items: Omit<RankedItem, "rank" | "reports">[] = [];
    for (const a of assignments) {
      const problem = await repo.getProblem(a.problemId);
      if (problem) items.push({ assignment: a, problem });
    }
    const top = rank(items);
    const ranked: RankedItem[] = [];
    for (const [i, it] of top.entries()) {
      ranked.push({ ...it, rank: i + 1, reports: await getReportsForProblem(it.problem.id) });
    }
    return { items: ranked, total: assignments.length };
  }

  const sql = getSql();
  const assignmentRows = await sql<AssignmentRow[]>`
    select * from assignments
    where entity_id = ${entityId} and state not in ('closed', 'rerouted')`;
  if (assignmentRows.length === 0) return { items: [], total: 0 };

  const problemIds = [...new Set(assignmentRows.map((a) => a.problem_id))];
  const problemRows = await sql<ProblemRow[]>`
    select * from problems where id in ${sql(problemIds)}`;
  const problems = new Map(problemRows.map((r) => [r.id, toProblem(r)]));

  const top = rank(
    assignmentRows.flatMap((r) => {
      const problem = problems.get(r.problem_id);
      return problem ? [{ assignment: toAssignment(r), problem }] : [];
    }),
  );

  const topIds = top.map((it) => it.problem.id);
  const reportRows = await sql<(ReportRow & { member_of: string })[]>`
    select r.*, pr.problem_id as member_of from reports r
    join problem_reports pr on pr.report_id = r.id
    where pr.problem_id in ${sql(topIds)}
    order by r.requested_at`;
  const reportsByProblem = new Map<string, Report[]>();
  for (const row of reportRows) {
    const list = reportsByProblem.get(row.member_of) ?? [];
    list.push(toReport(row));
    reportsByProblem.set(row.member_of, list);
  }
  for (const it of top) it.problem.reportIds = (reportsByProblem.get(it.problem.id) ?? []).map((r) => r.id);

  return {
    items: top.map((it, i) => ({
      ...it,
      rank: i + 1,
      reports: reportsByProblem.get(it.problem.id) ?? [],
    })),
    total: assignmentRows.length,
  };
}

/** Full member reports for a problem (description, address, photos). */
export async function getReportsForProblem(problemId: string): Promise<import("@/core/types").Report[]> {
  if (!process.env.DATABASE_URL) {
    const { fixtureReports } = await import("@/core/fixtures");
    return fixtureReports.filter((r) => r.problemId === problemId);
  }
  const sql = getSql();
  const rows = await sql<
    {
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
    }[]
  >`
    select r.* from reports r
    join problem_reports pr on pr.report_id = r.id
    where pr.problem_id = ${problemId}
    order by r.requested_at`;
  return rows.map((r) => ({
    id: r.id,
    source: r.source as import("@/core/types").ReportSource,
    serviceName: r.service_name,
    description: r.description ?? undefined,
    lat: r.lat,
    lon: r.lon,
    address: r.address,
    mediaUrl: r.media_url ?? undefined,
    requestedAt:
      typeof r.requested_at === "string"
        ? r.requested_at
        : r.requested_at.toISOString(),
    preferredLanguage: r.preferred_language ?? undefined,
  }));
}

export interface ScorecardView {
  entityId: string;
  name: string;
  open: number;
  overdueShare: number;
  rerouteRate: number;
  notFoundShare: number;
}

/** The scorecard rows for the overview, joined to entity names. */
export async function getScorecard(): Promise<ScorecardView[]> {
  const repo = getRepo();
  const entities = loadEntities();
  const rows = await repo.scorecard();

  // Open and overdue come straight from the live assignments, so the scorecard
  // shows real numbers before anyone has recorded an outcome.
  const live = new Map<string, { open: number; overdue: number }>();
  if (process.env.DATABASE_URL) {
    const sql = getSql();
    const counts = await sql<{ entity_id: string; open: number; overdue: number }[]>`
      select entity_id,
             count(*)::int as open,
             count(*) filter (where resolve_by < ${DEMO_NOW})::int as overdue
      from assignments
      where state not in ('closed', 'rerouted')
      group by entity_id`;
    for (const c of counts) live.set(c.entity_id, { open: c.open, overdue: c.overdue });
  } else {
    for (const e of entities) {
      const inbox = await repo.listInbox(e.id);
      const overdue = inbox.filter((a) => Date.parse(a.resolveBy) < DEMO_NOW.getTime()).length;
      live.set(e.id, { open: inbox.length, overdue });
    }
  }

  return rows
    .filter((r) => r.entityId !== "triage")
    .map((r) => {
      const l = live.get(r.entityId) ?? { open: 0, overdue: 0 };
      return {
        entityId: r.entityId,
        name: entities.find((e) => e.id === r.entityId)?.name ?? r.entityId,
        open: l.open,
        overdueShare: l.open ? l.overdue / l.open : 0,
        rerouteRate: r.rerouteRate ?? 0,
        notFoundShare: r.notFoundShare ?? 0,
      };
    })
    .sort((a, b) => b.open - a.open);
}
