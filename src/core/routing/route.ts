import type {
  Entity,
  Problem,
  RoutingDecision,
  RoutingOverride,
} from "@/core/types";

// Routing (build-plan §5). First match wins; the result always carries a human
// "reason". route() never throws and fills `missing` from the owner's `need`.
//
//   1. Learned override for this family + road segment (or ~50 m area key).
//   2. Jurisdiction: jurisdictionCode 1 → MassDOT, 3 → DCR; 0 or H → private
//      (the PRIVATE_PROPERTY path — no city entity owns it).
//   3. Service family via entity.owns.
//   4. Triage: never drop a problem.

const JURISDICTION_ENTITY: Record<string, string> = {
  "1": "massdot",
  "3": "dcr",
};
const PRIVATE_CODES = new Set(["0", "H"]);

/** ~50 m grid key, matching the override key applyOutcome() writes. */
export function areaKeyFor(lat: number, lon: number): string {
  const q = (n: number) => (Math.round(n / 0.00045) * 0.00045).toFixed(5);
  return `${q(lat)},${q(lon)}`;
}

function missingFrom(entity: Entity | undefined): string[] {
  // For the demo, surface the entity's required items so the packet can flag
  // what the reporter still needs to supply.
  return entity?.need ? [...entity.need] : [];
}

export function route(
  problem: Problem,
  ctx: { entities: Entity[]; overrides: RoutingOverride[] },
): RoutingDecision {
  const byId = (id: string) => ctx.entities.find((e) => e.id === id);

  // 1. Learned override.
  const areaKey = areaKeyFor(problem.lat, problem.lon);
  const override = ctx.overrides.find(
    (o) =>
      o.serviceFamily === problem.serviceFamily &&
      ((problem.roadSegmentId !== undefined &&
        o.roadSegmentId === problem.roadSegmentId) ||
        (o.areaKey !== undefined && o.areaKey === areaKey)),
  );
  if (override) {
    const owner = byId(override.entityId);
    return {
      entityId: override.entityId,
      queue: owner?.queues[0],
      reason: `Learned: this segment was rerouted to ${owner?.name ?? override.entityId}`,
      confidence: "learned",
      missing: missingFrom(owner),
    };
  }

  // 2. Jurisdiction.
  const code = problem.jurisdictionCode;
  if (code !== undefined) {
    if (PRIVATE_CODES.has(code)) {
      return {
        entityId: "triage",
        reason:
          "Private property (MassDOT Road Inventory): the city cannot repair it — PRIVATE_PROPERTY",
        confidence: "triage",
        missing: [],
      };
    }
    const entityId = JURISDICTION_ENTITY[code];
    if (entityId) {
      const owner = byId(entityId);
      if (owner) {
        return {
          entityId,
          queue: owner.queues[0],
          reason: `${owner.name} segment (MassDOT Road Inventory)`,
          confidence: "jurisdiction",
          missing: missingFrom(owner),
        };
      }
    }
  }

  // 3. Service family.
  const owner = ctx.entities.find((e) => e.owns.includes(problem.serviceFamily));
  if (owner) {
    return {
      entityId: owner.id,
      queue: owner.queues[0],
      reason: `${owner.name} owns ${problem.serviceFamily}`,
      confidence: "rule",
      missing: missingFrom(owner),
    };
  }

  // 4. Triage.
  return {
    entityId: "triage",
    reason: `No owner for "${problem.serviceFamily}"; sent to the ops triage queue`,
    confidence: "triage",
    missing: [],
  };
}
