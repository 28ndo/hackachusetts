import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { Entity, Problem, RoutingOverride } from "@/core/types";
import { route, areaKeyFor } from "@/core/routing/route";

const entities: Entity[] = [
  { id: "massdot", name: "MassDOT", kind: "state_agency", queues: ["INFO_Mass DOT"], owns: ["pothole", "streetlight"], where: { jurisdictionCodes: ["1"] } },
  { id: "dcr", name: "DCR", kind: "state_agency", queues: ["INFO_Mass DCR"], owns: ["pothole", "streetlight", "tree"], where: { jurisdictionCodes: ["3"] } },
  { id: "pwd", name: "PWD", kind: "city_dept", queues: ["PWDx_x"], owns: ["pothole"], where: { jurisdictionCodes: ["2"] } },
  { id: "btd-signals", name: "BTDT Signals", kind: "city_dept", queues: ["BTDT_x"], owns: ["signal", "sign"] },
];

function problem(opts: Partial<Problem> & { serviceFamily: string }): Problem {
  return {
    id: "p",
    lat: 42.3,
    lon: -71.1,
    neighborhood: "",
    reportIds: [],
    reporterCount: 1,
    firstReportedAt: "2026-10-01T00:00:00Z",
    lastReportedAt: "2026-10-01T00:00:00Z",
    status: "new",
    priority: { score: 0, hazard: 0, people: 0, overdue: 0, gap: 1, why: "" },
    ...opts,
  };
}

describe("route() — examples", () => {
  it("routes by jurisdiction code 3 to DCR", () => {
    const d = route(problem({ serviceFamily: "streetlight", jurisdictionCode: "3" }), { entities, overrides: [] });
    expect(d.entityId).toBe("dcr");
    expect(d.confidence).toBe("jurisdiction");
  });

  it("routes private codes to the PRIVATE_PROPERTY path", () => {
    for (const code of ["0", "H"]) {
      const d = route(problem({ serviceFamily: "streetlight", jurisdictionCode: code }), { entities, overrides: [] });
      expect(d.reason).toContain("PRIVATE_PROPERTY");
      expect(d.entityId).toBe("triage");
    }
  });

  it("falls back to family ownership for city roads", () => {
    const d = route(problem({ serviceFamily: "signal", jurisdictionCode: "2" }), { entities, overrides: [] });
    expect(d.entityId).toBe("btd-signals");
    expect(d.confidence).toBe("rule");
  });

  it("sends a signal on a DCR segment to the signal owner, not DCR (DCR doesn't own signals)", () => {
    const d = route(problem({ serviceFamily: "signal", jurisdictionCode: "3" }), { entities, overrides: [] });
    expect(d.entityId).toBe("btd-signals");
    expect(d.confidence).toBe("rule");
  });

  it("sends an unowned family to triage without throwing", () => {
    const d = route(problem({ serviceFamily: "unknown-family" }), { entities, overrides: [] });
    expect(d.entityId).toBe("triage");
    expect(d.confidence).toBe("triage");
  });
});

describe("route() — property based", () => {
  const arbCode = fc.constantFrom("1", "2", "3", "0", "H", undefined);
  const arbFamily = fc.constantFrom("pothole", "streetlight", "signal", "tree", "unknown");

  it("never throws and always returns exactly one decision", () => {
    fc.assert(
      fc.property(arbFamily, arbCode, (family, code) => {
        const d = route(problem({ serviceFamily: family, jurisdictionCode: code }), { entities, overrides: [] });
        expect(typeof d.entityId).toBe("string");
        expect(d.entityId.length).toBeGreaterThan(0);
        expect(typeof d.reason).toBe("string");
        expect(["learned", "jurisdiction", "rule", "triage"]).toContain(d.confidence);
        expect(Array.isArray(d.missing)).toBe(true);
      }),
    );
  });

  it("every non-triage decision goes to an entity that owns the problem's family", () => {
    fc.assert(
      fc.property(arbFamily, arbCode, (family, code) => {
        const d = route(problem({ serviceFamily: family, jurisdictionCode: code }), { entities, overrides: [] });
        if (d.entityId === "triage") return;
        const owner = entities.find((e) => e.id === d.entityId);
        expect(owner?.owns).toContain(family);
      }),
    );
  });

  it("an override always wins over jurisdiction and family routing", () => {
    fc.assert(
      fc.property(arbFamily, arbCode, (family, code) => {
        const lat = 42.3;
        const lon = -71.1;
        const override: RoutingOverride = {
          serviceFamily: family,
          areaKey: areaKeyFor(lat, lon),
          entityId: "dcr",
          learnedFrom: "o1",
          createdAt: "2026-10-24T00:00:00Z",
        };
        const d = route(
          problem({ serviceFamily: family, jurisdictionCode: code, lat, lon }),
          { entities, overrides: [override] },
        );
        expect(d.entityId).toBe("dcr");
        expect(d.confidence).toBe("learned");
      }),
    );
  });
});
