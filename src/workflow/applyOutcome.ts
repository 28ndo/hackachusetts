// Apply an entity's structured answer (build-plan §6): record it, move the states,
// and on NOT_OURS reroute and learn an override for this spot.

import type { Outcome, OutcomeCode, OutcomeInput, Repo, RoutingOverride, StateChange } from "@/core/types";
import { OUTCOMES } from "@/core/outcomes";
import { entityById, entityName, loadEntities } from "@/core/entities";
import { residentMessage } from "@/core/locales";
import { areaKeyFor } from "@/core/routing/route";
import { buildAssignment } from "@/workflow/assign";

const NEED_LABEL: Record<OutcomeInput, string> = {
  scheduledFor: "a date",
  newOwnerId: "a new owner",
  note: "a note",
  photoUrl: "a photo",
};

export async function applyOutcome(
  repo: Repo,
  input: {
    assignmentId: string;
    code: OutcomeCode;
    note?: string;
    photoUrl?: string;
    scheduledFor?: string;
    newOwnerId?: string;
    by?: string;
  },
  now = new Date(),
): Promise<StateChange> {
  const assignment = await repo.getAssignment(input.assignmentId);
  if (!assignment) throw new Error(`Assignment ${input.assignmentId} not found`);
  if (assignment.state === "closed" || assignment.state === "rerouted") {
    throw new Error(`Assignment ${input.assignmentId} is already ${assignment.state}`);
  }
  const problem = await repo.getProblem(assignment.problemId);
  if (!problem) throw new Error(`Problem ${assignment.problemId} not found`);

  const spec = OUTCOMES[input.code];
  if (!spec) throw new Error(`Unknown outcome code ${input.code}`);
  for (const need of spec.needs) {
    if (!input[need]?.trim()) throw new Error(`${input.code} needs ${NEED_LABEL[need]}`);
  }
  if (input.code === "NOT_OURS") {
    if (!entityById(input.newOwnerId!)) throw new Error(`Unknown entity ${input.newOwnerId}`);
    if (input.newOwnerId === assignment.entityId) throw new Error("NOT_OURS needs a different owner");
  }

  const outcome: Outcome = {
    id: `o-${assignment.id}-${Date.now()}`,
    assignmentId: assignment.id,
    code: input.code,
    note: input.note,
    photoUrl: input.photoUrl,
    scheduledFor: input.scheduledFor,
    newOwnerId: input.newOwnerId,
    by: input.by ?? assignment.entityId,
    at: now.toISOString(),
  };
  await repo.recordOutcome(outcome);
  await repo.updateAssignment(assignment.id, { state: spec.nextAssignmentState });
  await repo.updateProblem(problem.id, { status: spec.nextProblemStatus });

  const change: StateChange = {
    problemId: problem.id,
    assignmentId: assignment.id,
    code: input.code,
    previousProblemStatus: problem.status,
    nextProblemStatus: spec.nextProblemStatus,
    previousAssignmentState: assignment.state,
    nextAssignmentState: spec.nextAssignmentState,
    residentMessage: residentMessage(input.code, "en", {
      // FIXED has no date input; it was fixed today.
      date: input.scheduledFor ?? (input.code === "FIXED" ? now.toISOString().slice(0, 10) : undefined),
      owner: input.newOwnerId ? entityName(input.newOwnerId) : undefined,
      note: input.note,
      contact: input.note,
    }),
  };

  if (input.code === "NOT_OURS") {
    const newOwnerId = input.newOwnerId!;
    const newAssignment = buildAssignment(
      { ...problem, status: spec.nextProblemStatus },
      {
        entityId: newOwnerId,
        confidence: "learned",
        reason: `Rerouted by ${entityName(assignment.entityId)}: not theirs. Rule learned for this segment.`,
        missing: [],
      },
      loadEntities(),
      assignment.attempt + 1,
      now,
    );
    const override: RoutingOverride = {
      id: `ro-${outcome.id}`,
      serviceFamily: problem.serviceFamily,
      ...(problem.roadSegmentId
        ? { roadSegmentId: problem.roadSegmentId }
        : { areaKey: areaKeyFor(problem.lat, problem.lon) }),
      entityId: newOwnerId,
      learnedFrom: outcome.id,
      learnedFromEntityId: assignment.entityId,
      createdAt: now.toISOString(),
    };
    await repo.createAssignment(newAssignment);
    await repo.addOverride(override);
    change.newAssignment = newAssignment;
    change.learnedOverride = override;
  }
  // DUPLICATE: the note may name the target problem; we close without merging data.
  return change;
}
