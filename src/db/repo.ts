import type {
  Assignment,
  Outcome,
  Problem,
  Report,
  Repo,
  RoutingOverride,
  ScorecardRow,
} from "@/core/types";

/**
 * Postgres-backed Repo (PLAYBOOK §2).
 *
 * TODO (P2, problem-ledger spec): implement every method against Neon Postgres
 * using the `postgres` client. ingestReport = addReport → route → create the
 * assignment. Niklas develops against fixtureRepo until this lands.
 */
export class PostgresRepo implements Repo {
  listInbox(entityId: string): Promise<Assignment[]> {
    void entityId;
    throw new Error("TODO: PostgresRepo.listInbox not implemented");
  }

  getProblem(problemId: string): Promise<Problem | undefined> {
    void problemId;
    throw new Error("TODO: PostgresRepo.getProblem not implemented");
  }

  recordOutcome(outcome: Outcome): Promise<void> {
    void outcome;
    throw new Error("TODO: PostgresRepo.recordOutcome not implemented");
  }

  createAssignment(assignment: Assignment): Promise<void> {
    void assignment;
    throw new Error("TODO: PostgresRepo.createAssignment not implemented");
  }

  updateAssignment(
    assignmentId: string,
    patch: Partial<Assignment>,
  ): Promise<void> {
    void assignmentId;
    void patch;
    throw new Error("TODO: PostgresRepo.updateAssignment not implemented");
  }

  updateProblem(problemId: string, patch: Partial<Problem>): Promise<void> {
    void problemId;
    void patch;
    throw new Error("TODO: PostgresRepo.updateProblem not implemented");
  }

  addOverride(override: RoutingOverride): Promise<void> {
    void override;
    throw new Error("TODO: PostgresRepo.addOverride not implemented");
  }

  listOverrides(): Promise<RoutingOverride[]> {
    throw new Error("TODO: PostgresRepo.listOverrides not implemented");
  }

  scorecard(): Promise<ScorecardRow[]> {
    throw new Error("TODO: PostgresRepo.scorecard not implemented");
  }

  ingestReport(report: Report): Promise<Problem> {
    void report;
    throw new Error("TODO: PostgresRepo.ingestReport not implemented");
  }
}
