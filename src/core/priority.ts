import type { Entity, Priority, Problem } from "@/core/types";

/**
 * Score a problem for its entity's queue.
 *
 * Stub: score = reporterCount, factors set to neutral.
 * TODO (P3, routing-and-priority spec): implement the §5 formula —
 *   priority = hazard × people × overdue, where
 *   people = 1 + log2(reporterCount × gap), overdue from hoursPastTarget,
 *   gap from BARI custodianship. Return the factor breakdown and "why" string.
 */
export function priority(
  problem: Problem,
  entity: Entity,
  now: Date,
): Priority {
  void entity;
  void now;
  return {
    score: problem.reporterCount,
    hazard: 1,
    people: problem.reporterCount,
    overdue: 1,
    gap: 1,
    why: `${problem.reporterCount} report(s) waiting`,
  };
}
