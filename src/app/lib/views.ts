import type { Assignment, Entity, Problem } from "@/core/types";
import { getRepo } from "@/db/getRepo";
import { getSql } from "@/db/client";
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
}

/** A single entity's inbox, ranked by priority (highest first). */
export async function getRankedInbox(entityId: string): Promise<RankedItem[]> {
  const repo = getRepo();
  const entity = loadEntities().find((e) => e.id === entityId);
  const assignments = await repo.listInbox(entityId);

  const items: RankedItem[] = [];
  for (const a of assignments) {
    const problem = await repo.getProblem(a.problemId);
    if (!problem) continue;
    if (entity) problem.priority = priority(problem, entity, DEMO_NOW);
    items.push({ assignment: a, problem, rank: 0 });
  }
  items.sort((x, y) => y.problem.priority.score - x.problem.priority.score);
  items.forEach((it, i) => (it.rank = i + 1));
  return items;
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

/** The scorecard rows for the overview, joined to entity names. */
export async function getScorecard(): Promise<
  { entityId: string; name: string; rerouteRate: number; notFoundShare: number }[]
> {
  const repo = getRepo();
  const entities = loadEntities();
  const rows = await repo.scorecard();
  return rows
    .filter((r) => r.entityId !== "triage")
    .map((r) => ({
      entityId: r.entityId,
      name: entities.find((e) => e.id === r.entityId)?.name ?? r.entityId,
      rerouteRate: r.rerouteRate ?? 0,
      notFoundShare: r.notFoundShare ?? 0,
    }));
}
