// Turn a routing decision into a work packet with honest deadlines (build-plan §3, §4).

import type { Assignment, Entity, Problem, RoutingDecision } from "@/core/types";
import { respondWithinHours } from "@/core/entities";

const HOUR_MS = 3_600_000;

export function buildAssignment(
  problem: Problem,
  decision: RoutingDecision,
  entities: Entity[],
  attempt: number,
  sentAt: Date,
): Assignment {
  const entity = entities.find((e) => e.id === decision.entityId);
  const resolveDays = Math.max(1, entity?.workload?.medianDays ?? entity?.workload?.slaDays ?? 7);
  return {
    id: `a-${problem.id}-${attempt}`,
    problemId: problem.id,
    entityId: decision.entityId,
    attempt,
    sentAt: sentAt.toISOString(),
    respondBy: new Date(sentAt.getTime() + respondWithinHours(entity) * HOUR_MS).toISOString(),
    resolveBy: new Date(sentAt.getTime() + resolveDays * 24 * HOUR_MS).toISOString(),
    routingReason: decision.reason,
    confidence: decision.confidence,
    state: "sent",
  };
}
