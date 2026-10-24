import type { Entity, Problem, RoutingDecision, RoutingOverride } from "@/core/types";

/**
 * Route a problem to its owning entity.
 *
 * Working stub: routes by `entity.owns` (service family) with confidence "rule".
 * TODO (P3, routing-and-priority spec): implement the §5 steps in order —
 *   1. learned override, 2. jurisdiction, 3. service type, 4. ambiguous → triage,
 *   5. no match → triage. Fill `missing` from the entity's `need` list.
 */
export function route(
  problem: Problem,
  ctx: { entities: Entity[]; overrides: RoutingOverride[] },
): RoutingDecision {
  const owner = ctx.entities.find((e) => e.owns.includes(problem.serviceFamily));

  if (!owner) {
    return {
      entityId: "triage",
      reason: `No entity owns service family "${problem.serviceFamily}"`,
      confidence: "triage",
      missing: [],
    };
  }

  return {
    entityId: owner.id,
    queue: owner.queues[0],
    reason: `${owner.name} owns ${problem.serviceFamily}`,
    confidence: "rule",
    missing: [],
  };
}
