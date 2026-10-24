import type {
  AssignmentState,
  Outcome,
  Problem,
  Repo,
  RoutingOverride,
  StateChange,
} from "@/core/types";
import { OUTCOMES } from "@/core/outcomes";
import { areaKeyFor } from "@/core/routing/route";

// Apply an entity's structured outcome to the ledger and return what changed
// (build-plan §6). Every code records the outcome and moves the problem and
// assignment to the next states from OUTCOMES. NOT_OURS also reroutes and
// learns: it closes the current assignment as "rerouted", opens a new one for
// the chosen owner (attempt + 1), and stores a RoutingOverride keyed by the road
// segment (or a ~50 m area key) plus the family, so the next report on that
// segment routes straight to the new owner.
//
// The Repo interface is intentionally small and has no getAssignment, so the
// problem is recovered from the stable assignment-id convention "a-<problemId>…"
// (problem ids start with "p-"). The caller acts on an open assignment, so the
// previous state defaults to "sent".

export async function applyOutcome(
  repo: Repo,
  assignmentId: string,
  outcome: Outcome,
): Promise<StateChange> {
  const spec = OUTCOMES[outcome.code];
  if (!spec) throw new Error(`Unknown outcome code: ${outcome.code}`);

  const problem = await getProblemFor(repo, assignmentId);
  const previousProblemStatus = problem.status;
  const previousAssignmentState: AssignmentState = "sent";

  await repo.recordOutcome(outcome);

  const change: StateChange = {
    problemId: problem.id,
    assignmentId,
    previousProblemStatus,
    nextProblemStatus: spec.nextProblemStatus,
    previousAssignmentState,
    nextAssignmentState: spec.nextAssignmentState,
    residentMessage: spec.residentMessage(outcome),
  };

  if (outcome.code === "NOT_OURS") {
    if (!outcome.newOwnerId) throw new Error("NOT_OURS requires newOwnerId");

    await repo.updateAssignment(assignmentId, { state: "rerouted" });

    const attempt = attemptOf(assignmentId) + 1;
    const now = outcome.at;
    const newAssignmentId = `a-${problem.id}-${outcome.newOwnerId}-${attempt}`;
    await repo.createAssignment({
      id: newAssignmentId,
      problemId: problem.id,
      entityId: outcome.newOwnerId,
      attempt,
      sentAt: now,
      respondBy: new Date(Date.parse(now) + 48 * 3_600_000).toISOString(),
      resolveBy: new Date(Date.parse(now) + 48 * 3_600_000 * 3).toISOString(),
      routingReason: "Rerouted to the owner the previous entity named",
      confidence: "learned",
      state: "sent",
    });

    const override: RoutingOverride = {
      serviceFamily: problem.serviceFamily,
      roadSegmentId: problem.roadSegmentId,
      areaKey: problem.roadSegmentId
        ? undefined
        : areaKeyFor(problem.lat, problem.lon),
      entityId: outcome.newOwnerId,
      learnedFrom: outcome.id,
      createdAt: now,
    };
    await repo.addOverride(override);
    await repo.updateProblem(problem.id, { status: spec.nextProblemStatus });

    change.newAssignmentId = newAssignmentId;
    change.learnedOverride = override;
    return change;
  }

  await repo.updateAssignment(assignmentId, { state: spec.nextAssignmentState });
  await repo.updateProblem(problem.id, { status: spec.nextProblemStatus });
  return change;
}

/** Recover the problem for an assignment via the "a-<problemId>…" convention. */
async function getProblemFor(repo: Repo, assignmentId: string): Promise<Problem> {
  const problemId = problemIdOf(assignmentId);
  const problem = await repo.getProblem(problemId);
  if (!problem) {
    throw new Error(`No problem found for assignment ${assignmentId}`);
  }
  return problem;
}

/**
 * Assignment ids are "a-<problemId>" optionally followed by "-<owner>-<attempt>"
 * (reroutes) or "-<timestamp>" (ingest). The problem id is "p-…"; take from the
 * leading "a-" up to the first owner/timestamp suffix that is not part of it.
 */
function problemIdOf(assignmentId: string): string {
  const body = assignmentId.replace(/^a-/, "");
  // Strip a trailing "-<entityId>-<number>" reroute suffix if present.
  const reroute = /^(.*)-[a-z][\w-]*-\d+$/.exec(body);
  if (reroute && reroute[1].startsWith("p-")) return reroute[1];
  // Strip a trailing "-<timestamp>" ingest suffix if present.
  const ingest = /^(.*)-\d{10,}$/.exec(body);
  if (ingest && ingest[1].startsWith("p-")) return ingest[1];
  return body;
}

/** The attempt number encoded in a reroute assignment id, or 1 by default. */
function attemptOf(assignmentId: string): number {
  const m = /-(\d+)$/.exec(assignmentId);
  if (m) {
    const n = Number(m[1]);
    // A bare timestamp suffix (10+ digits) is not an attempt counter.
    if (m[1].length < 7) return n;
  }
  return 1;
}
