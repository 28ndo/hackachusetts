import type { Entity, Priority, Problem } from "@/core/types";

// Priority (build-plan §5): priority = hazard × people × overdue.
//   hazard   1–5 per service family, from the entity catalog.
//   people   1 + log2(reporterCount × gap). gap is 1 here (BARI weighting is
//            pitch-only, §5), but kept in the formula and the breakdown.
//   overdue  1 + min(hoursPastTarget / targetHours, 2), capped at 3.
// The factors are shown on the card and summarized in a "why" line.

// Fallback hazard by family when an entity does not list one (build-plan §5).
const FAMILY_HAZARD: Record<string, number> = {
  wire: 5,
  pothole: 3,
  sidewalk: 3,
  tree: 3,
  signal: 2,
  sign: 2,
  streetlight: 2,
  litter: 1,
};

const OVERDUE_CAP = 3;

/** Parse a respondWithin string like "4h" or "48h" into hours; default 48. */
function targetHours(entity: Entity): number {
  const raw = entity.respondWithin;
  if (raw) {
    const m = /^(\d+(?:\.\d+)?)\s*h/i.exec(raw.trim());
    if (m) return Number(m[1]);
  }
  if (entity.workload?.slaDays) return entity.workload.slaDays * 24;
  return 48;
}

function hazardFor(problem: Problem, entity: Entity): number {
  return (
    entity.hazard?.[problem.serviceFamily] ??
    FAMILY_HAZARD[problem.serviceFamily] ??
    1
  );
}

export function priority(
  problem: Problem,
  entity: Entity,
  now: Date,
): Priority {
  const gap = 1;
  const hazard = hazardFor(problem, entity);

  const reporterCount = Math.max(problem.reporterCount, 1);
  const people = 1 + Math.log2(reporterCount * gap);

  const target = targetHours(entity);
  const sentBasis = Date.parse(problem.firstReportedAt);
  const hoursSince = (now.getTime() - sentBasis) / 3_600_000;
  const hoursPastTarget = Math.max(hoursSince - target, 0);
  const overdue = 1 + Math.min(hoursPastTarget / target, 2); // 1..3, cap at OVERDUE_CAP
  const overdueClamped = Math.min(overdue, OVERDUE_CAP);

  const score = hazard * people * overdueClamped;

  const daysOverdue = Math.floor(hoursPastTarget / 24);
  const whyParts = [
    `${reporterCount} ${reporterCount === 1 ? "person" : "people"} waiting`,
  ];
  if (daysOverdue > 0) whyParts.push(`${daysOverdue} days overdue`);
  whyParts.push(`hazard ${hazard}`);

  return {
    score,
    hazard,
    people,
    overdue: overdueClamped,
    gap,
    why: whyParts.join(" · "),
  };
}
