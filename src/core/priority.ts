// priority = hazard × people × overdue (build-plan §5). Every factor is shown on the card.
// gap scales the reporter count only; it never touches hazard or lateness.

import type { Entity, Priority, Problem } from "@/core/types";
import { respondWithinHours } from "@/core/entities";

const DEFAULT_HAZARD: Record<string, number> = {
  wire: 5,
  signal: 4,
  pothole: 3,
  sidewalk: 3,
  tree: 3,
  streetlight: 2,
  sign: 2,
};

const round = (x: number, places: number) => Math.round(x * 10 ** places) / 10 ** places;

export function hoursWaiting(problem: Problem, now: Date): number {
  return (now.getTime() - Date.parse(problem.firstReportedAt)) / 3_600_000;
}

export function priority(problem: Problem, entity: Entity | undefined, now: Date, gap = 1): Priority {
  const family = problem.serviceFamily;
  const hazard = entity?.hazard?.[family] ?? DEFAULT_HAZARD[family] ?? 2;
  const people = 1 + Math.log2(Math.max(1, problem.reporterCount * gap));
  const targetHours = respondWithinHours(entity);
  const hoursPast = Math.max(0, hoursWaiting(problem, now) - targetHours);
  const overdue = 1 + Math.min(hoursPast / targetHours, 2);

  const n = problem.reporterCount;
  const why = [n === 1 ? "1 person waiting" : `${n} people waiting`];
  if (overdue > 1) {
    const days = hoursPast / 24;
    const d = Math.round(days);
    why.push(days < 1 ? "less than a day overdue" : `${d} ${d === 1 ? "day" : "days"} overdue`);
  }
  why.push(`hazard ${hazard}`);
  if (gap > 1) why.push("low-reporting area");

  return {
    score: round(hazard * people * overdue, 1),
    hazard,
    people: round(people, 2),
    overdue: round(overdue, 2),
    gap,
    why: why.join(" · "),
  };
}
