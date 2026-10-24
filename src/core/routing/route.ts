// Explainable routing (build-plan §5). First match wins; every decision carries a reason.
//   1 learned override → 2 jurisdiction (Road Inventory code) → 3 service family → 4 triage

import {
  TRIAGE_ID,
  type Entity,
  type Problem,
  type Report,
  type RoutingDecision,
  type RoutingOverride,
} from "@/core/types";
import { familyLabel } from "@/core/entities";

/**
 * Grid key for overrides when no road segment is known. Cells are 1/2000° (0.0005°):
 * about 55 m north-south and 41 m east-west at Boston's latitude, so roughly a 50 m block.
 */
export function areaKeyFor(lat: number, lon: number): string {
  const snap = (x: number) => (Math.round(x * 2000) / 2000).toFixed(4);
  return `${snap(lat)}:${snap(lon)}`;
}

const LOCATION = ["address", "street", "location", "intersection", "landmark", "cross"];
const DETAIL = ["what", "problem", "wrong", "which", "out", "part", "big"];

/** entity.need items the reports don't satisfy (keyword heuristic). */
export function missingItems(entity: Entity | undefined, reports: Report[]): string[] {
  const hasPhoto = reports.some((r) => r.mediaUrls.length > 0);
  const hasAddress = reports.some((r) => r.address?.trim());
  const hasDetail = reports.some((r) => (r.description?.trim().length ?? 0) >= 12);
  const hasSegment = reports.some((r) => r.roadSegmentId);
  return (entity?.need ?? []).filter((item) => {
    const s = item.toLowerCase();
    if (s === "reportercount") return false;
    if (s === "roadsegmentid") return !hasSegment;
    if (s.includes("photo") && hasPhoto) return false;
    if (LOCATION.some((w) => s.includes(w)) && hasAddress) return false;
    if (DETAIL.some((w) => s.includes(w)) && hasDetail) return false;
    return true;
  });
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function route(
  problem: Problem,
  ctx: { entities: Entity[]; overrides: RoutingOverride[]; reports?: Report[] },
): RoutingDecision {
  try {
    return decide(problem, ctx);
  } catch {
    return { entityId: TRIAGE_ID, reason: "Routing failed; held for ops triage", confidence: "triage", missing: [] };
  }
}

function decide(
  problem: Problem,
  ctx: { entities: Entity[]; overrides: RoutingOverride[]; reports?: Report[] },
): RoutingDecision {
  const family = problem.serviceFamily;
  const label = familyLabel(family).toLowerCase();
  const byId = (id: string) => ctx.entities.find((e) => e.id === id);
  const nameOf = (id: string) => (id === TRIAGE_ID ? "Ops triage" : (byId(id)?.name ?? id));
  const road = problem.roadName ?? "unnamed road";
  const decision = (entityId: string, reason: string, confidence: RoutingDecision["confidence"]): RoutingDecision => {
    const entity = byId(entityId);
    return { entityId, queue: entity?.queues[0], reason, confidence, missing: missingItems(entity, ctx.reports ?? []) };
  };

  // 1. Learned override (newest first).
  const areaKey = areaKeyFor(problem.lat, problem.lon);
  const override = [...ctx.overrides]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find(
      (o) =>
        o.serviceFamily === family &&
        ((o.roadSegmentId !== undefined && o.roadSegmentId === problem.roadSegmentId) ||
          (o.areaKey !== undefined && o.areaKey === areaKey)),
    );
  if (override) {
    const where = problem.roadName ?? "this block";
    return decision(
      override.entityId,
      `Learned: ${nameOf(override.learnedFromEntityId)} sent this ${label} on ${where} to ${nameOf(override.entityId)} on ${shortDate(override.createdAt)}`,
      "learned",
    );
  }

  // 2. Jurisdiction, only when that agency actually owns this family.
  const code = problem.jurisdictionCode;
  const owns = (id: string) => byId(id)?.owns.includes(family) ?? false;
  if (code === "3" && owns("dcr")) {
    return decision("dcr", `DCR parkway segment (${road}), per the MassDOT Road Inventory`, "jurisdiction");
  }
  if (code === "1" && owns("massdot")) {
    return decision("massdot", `State road (${road}), per the MassDOT Road Inventory`, "jurisdiction");
  }
  if (code === "H") {
    return { ...decision(TRIAGE_ID, `Private way (${road}); city crews can't work here`, "triage"), suggestedOutcome: "PRIVATE_PROPERTY" };
  }

  // 3. Service family: a city department first, then any owner.
  const owner =
    ctx.entities.find((e) => e.kind === "city_dept" && e.owns.includes(family)) ??
    ctx.entities.find((e) => e.owns.includes(family));
  if (owner) {
    let reason = `${owner.name} handles ${label}s on city streets`;
    if (code === "0") reason = `Unaccepted way (${road}); ${reason}`;
    if (code === "1") reason = `${reason}, even on a MassDOT-owned road`;
    return decision(owner.id, reason, "rule");
  }

  // 4. Nobody owns it: never drop it.
  return decision(TRIAGE_ID, `No owner in the catalog for ${family}; held for ops triage`, "triage");
}
