// In-memory Repo for developing the app before the Postgres repo lands, and for
// property tests. Seeded from the real-record fixtures in src/core/fixtures.ts.

import type {
  Assignment,
  Outcome,
  Problem,
  Report,
  Repo,
  RoutingOverride,
  ScorecardRow,
} from "@/core/types";
import {
  fixtureAssignments,
  fixtureProblems,
  fixtureReports,
} from "@/core/fixtures";
import { loadEntities } from "@/core/entities";
import { route } from "@/core/routing/route";
import { priority } from "@/core/priority";
import { addReport } from "@/ledger/cluster";
import { haversineMeters } from "@/ledger/geo";

/** fixtureRepo plus a test/demo helper to seed the replay queue. */
export type FixtureRepo = Repo & { enqueueReplay(report: Report): void };

export function createFixtureRepo(): FixtureRepo {
  const reports = new Map<string, Report>(fixtureReports.map((r) => [r.id, r]));
  const problems = new Map<string, Problem>(
    fixtureProblems.map((p) => [p.id, structuredClone(p)]),
  );
  const assignments = new Map<string, Assignment>(
    fixtureAssignments.map((a) => [a.id, structuredClone(a)]),
  );
  const outcomes: Outcome[] = [];
  const overrides: RoutingOverride[] = [];
  // A tiny replay queue so the demo's "Replay next report" works on fixtures too.
  const replayQueue: Report[] = [];

  return {
    async listInbox(entityId: string): Promise<Assignment[]> {
      return [...assignments.values()].filter(
        (a) =>
          a.entityId === entityId &&
          a.state !== "closed" &&
          a.state !== "rerouted",
      );
    },

    async getProblem(problemId: string): Promise<Problem | undefined> {
      const p = problems.get(problemId);
      return p ? structuredClone(p) : undefined;
    },

    async recordOutcome(outcome: Outcome): Promise<void> {
      outcomes.push(structuredClone(outcome));
    },

    async createAssignment(assignment: Assignment): Promise<void> {
      assignments.set(assignment.id, structuredClone(assignment));
    },

    async updateAssignment(
      assignmentId: string,
      patch: Partial<Assignment>,
    ): Promise<void> {
      const a = assignments.get(assignmentId);
      if (a) assignments.set(assignmentId, { ...a, ...patch });
    },

    async updateProblem(
      problemId: string,
      patch: Partial<Problem>,
    ): Promise<void> {
      const p = problems.get(problemId);
      if (p) problems.set(problemId, { ...p, ...patch });
    },

    async addOverride(override: RoutingOverride): Promise<void> {
      overrides.push(structuredClone(override));
    },

    async listOverrides(): Promise<RoutingOverride[]> {
      return overrides.map((o) => structuredClone(o));
    },

    async scorecard(): Promise<ScorecardRow[]> {
      const byEntity = new Map<string, { total: number; rerouted: number }>();
      for (const a of assignments.values()) {
        const row = byEntity.get(a.entityId) ?? { total: 0, rerouted: 0 };
        row.total += 1;
        if (a.state === "rerouted") row.rerouted += 1;
        byEntity.set(a.entityId, row);
      }
      const notFound = new Map<string, number>();
      for (const o of outcomes) {
        if (o.code !== "NOT_FOUND") continue;
        const a = assignments.get(o.assignmentId);
        if (a) notFound.set(a.entityId, (notFound.get(a.entityId) ?? 0) + 1);
      }
      return [...byEntity.entries()].map(([entityId, r]) => ({
        entityId,
        rerouteRate: r.total ? r.rerouted / r.total : 0,
        notFoundShare: r.total ? (notFound.get(entityId) ?? 0) / r.total : 0,
      }));
    },

    async ingestReport(report: Report): Promise<Problem> {
      reports.set(report.id, structuredClone(report));

      // Nearby open problems of the same family (within ~30 m).
      const nearby = [...problems.values()].filter(
        (p) =>
          p.status !== "resolved" &&
          haversineMeters(report.lat, report.lon, p.lat, p.lon) <= 30,
      );
      const problem = addReport(report, nearby);
      const isExisting = problems.has(problem.id);

      if (!isExisting) {
        // Inherit road owner from a nearby sibling so routing still works.
        const sibling = nearby.find((p) => p.roadSegmentId || p.jurisdictionCode);
        if (sibling) {
          problem.roadSegmentId = sibling.roadSegmentId;
          problem.jurisdictionCode = sibling.jurisdictionCode;
        }
      }

      const entities = loadEntities();
      const decision = route(problem, { entities, overrides });
      const owner = entities.find((e) => e.id === decision.entityId);
      if (owner) {
        problem.priority = priority(problem, owner, new Date(report.requestedAt));
        problem.status = "routed";
      }
      problems.set(problem.id, structuredClone(problem));

      if (owner) {
        const sentAt = report.requestedAt;
        const hrs = Number(/^(\d+)/.exec(owner.respondWithin ?? "48h")?.[1] ?? 48);
        const a: Assignment = {
          id: `a-${problem.id}-${Date.now()}`,
          problemId: problem.id,
          entityId: decision.entityId,
          attempt: 1,
          sentAt,
          respondBy: new Date(Date.parse(sentAt) + hrs * 3_600_000).toISOString(),
          resolveBy: new Date(Date.parse(sentAt) + hrs * 3_600_000 * 3).toISOString(),
          routingReason: decision.reason,
          confidence:
            decision.confidence === "triage" ? "rule" : decision.confidence,
          state: "sent",
        };
        assignments.set(a.id, a);
      }
      return structuredClone(problem);
    },

    async nextReplayReport(): Promise<Report | undefined> {
      return replayQueue.shift();
    },

    enqueueReplay(report: Report): void {
      replayQueue.push(structuredClone(report));
    },
  };
}

export const fixtureRepo: FixtureRepo = createFixtureRepo();
