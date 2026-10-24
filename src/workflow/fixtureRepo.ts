// In-memory Repo for developing the app before the Postgres repo lands.
// Seeded from the real-record fixtures in src/core/fixtures.ts.

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

export function createFixtureRepo(): Repo {
  const reports = new Map<string, Report>(fixtureReports.map((r) => [r.id, r]));
  const problems = new Map<string, Problem>(
    fixtureProblems.map((p) => [p.id, structuredClone(p)]),
  );
  const assignments = new Map<string, Assignment>(
    fixtureAssignments.map((a) => [a.id, structuredClone(a)]),
  );
  const outcomes: Outcome[] = [];
  const overrides: RoutingOverride[] = [];

  return {
    async listInbox(entityId: string): Promise<Assignment[]> {
      return [...assignments.values()].filter(
        (a) => a.entityId === entityId && a.state !== "closed" && a.state !== "rerouted",
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
      // TODO (entity-workflow spec): compute real scorecard rows (§7).
      const byEntity = new Map<string, number>();
      for (const a of assignments.values()) {
        byEntity.set(a.entityId, (byEntity.get(a.entityId) ?? 0) + 1);
      }
      return [...byEntity.keys()].map((entityId) => ({ entityId }));
    },

    async ingestReport(report: Report): Promise<Problem> {
      // TODO (entity-workflow spec): call addReport() → route() → createAssignment().
      reports.set(report.id, structuredClone(report));
      throw new Error("TODO: fixtureRepo.ingestReport not implemented");
    },
  };
}

export const fixtureRepo: Repo = createFixtureRepo();
