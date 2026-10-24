import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { TRIAGE_ID, type Problem, type RoutingOverride } from "@/core/types";
import { loadEntities, SERVICE_FAMILIES } from "@/core/entities";
import { areaKeyFor, route } from "@/core/routing/route";

const entities = loadEntities();

const make = (family: string, code?: string, seg?: string): Problem => ({
  id: "p",
  serviceFamily: family,
  lat: 42.32,
  lon: -71.05,
  address: "x",
  roadSegmentId: seg,
  roadName: "Some Rd",
  jurisdictionCode: code,
  reportIds: [],
  reporterCount: 1,
  firstReportedAt: "2026-10-01T00:00:00Z",
  lastReportedAt: "2026-10-01T00:00:00Z",
  status: "new",
  priority: { score: 0, hazard: 1, people: 1, overdue: 1, gap: 1, why: "" },
});

const familyArb = fc.constantFrom(...SERVICE_FAMILIES, "litter", "not routed");
const codeArb = fc.option(fc.constantFrom("0", "1", "2", "3", "5", "B", "H"), { nil: undefined });

describe("route", () => {
  it("gives every problem exactly one decision with a reason", () => {
    fc.assert(
      fc.property(familyArb, codeArb, (family, code) => {
        const d = route(make(family, code), { entities, overrides: [] });
        expect(typeof d.entityId).toBe("string");
        expect(d.reason.length).toBeGreaterThan(0);
        expect(Array.isArray(d.missing)).toBe(true);
      }),
    );
  });

  it("an override always wins", () => {
    fc.assert(
      fc.property(familyArb, codeArb, fc.boolean(), fc.constantFrom(...entities.map((e) => e.id)), (family, code, bySeg, target) => {
        const p = make(family, code, bySeg ? "seg-1" : undefined);
        const o: RoutingOverride = {
          id: "ro",
          serviceFamily: family,
          ...(bySeg ? { roadSegmentId: "seg-1" } : { areaKey: areaKeyFor(p.lat, p.lon) }),
          entityId: target,
          learnedFrom: "o",
          learnedFromEntityId: "dcr",
          createdAt: "2026-10-24T12:00:00Z",
        };
        const d = route(p, { entities, overrides: [o] });
        expect(d.entityId).toBe(target);
        expect(d.confidence).toBe("learned");
      }),
    );
  });

  it("applies jurisdiction only when the agency owns the family", () => {
    expect(route(make("signal", "1"), { entities, overrides: [] }).entityId).toBe("btd-signals");
    expect(route(make("pothole", "3"), { entities, overrides: [] })).toMatchObject({ entityId: "dcr", confidence: "jurisdiction" });
    expect(route(make("streetlight", "1"), { entities, overrides: [] })).toMatchObject({ entityId: "massdot", confidence: "jurisdiction" });
  });

  it("sends private ways to triage with PRIVATE_PROPERTY", () => {
    expect(route(make("pothole", "H"), { entities, overrides: [] })).toMatchObject({
      entityId: TRIAGE_ID,
      confidence: "triage",
      suggestedOutcome: "PRIVATE_PROPERTY",
    });
  });

  it("uses city departments first, then any owner, then triage", () => {
    expect(route(make("streetlight"), { entities, overrides: [] }).entityId).toBe("pwd-street-lighting");
    expect(route(make("wire"), { entities, overrides: [] }).entityId).toBe("eversource");
    expect(route(make("pothole", "0"), { entities, overrides: [] }).reason).toMatch(/^Unaccepted way/);
    expect(route(make("graffiti"), { entities, overrides: [] }).entityId).toBe(TRIAGE_ID);
  });
});
