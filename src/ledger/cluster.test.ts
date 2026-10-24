import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { Report } from "@/core/types";
import { addReport, cluster } from "@/ledger/cluster";

// Build a Report from generated primitives. Service names are drawn from a small
// set of real families so familyOf() resolves deterministically.
const SERVICE_NAMES = [
  "Pothole",
  "Street Light Outage",
  "Traffic Signal Request",
  "Sidewalk Repair",
  "Fallen Tree or Branches",
] as const;

// Boston-ish bounding box, kept small so some reports cluster and some don't.
const arbReport = fc.record({
  id: fc.uuid(),
  serviceName: fc.constantFrom(...SERVICE_NAMES),
  lat: fc.double({ min: 42.28, max: 42.36, noNaN: true }),
  lon: fc.double({ min: -71.16, max: -71.04, noNaN: true }),
  dayOffset: fc.integer({ min: 0, max: 60 }),
}).map(
  (r): Report => ({
    id: r.id,
    source: "open311",
    serviceName: r.serviceName,
    lat: r.lat,
    lon: r.lon,
    address: "generated",
    requestedAt: new Date(
      Date.parse("2026-09-01T00:00:00Z") + r.dayOffset * 86_400_000,
    ).toISOString(),
  }),
);

// Distinct ids so membership is well-defined.
const arbReports = fc
  .array(arbReport, { minLength: 1, maxLength: 40 })
  .map((rs) => {
    const seen = new Set<string>();
    return rs.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  });

function membership(reports: Report[]): Map<string, string> {
  const problems = cluster(reports);
  const map = new Map<string, string>();
  for (const p of problems) {
    for (const rid of p.reportIds) map.set(rid, p.id);
  }
  return map;
}

describe("cluster() — property based", () => {
  it("every report belongs to exactly one problem", () => {
    fc.assert(
      fc.property(arbReports, (reports) => {
        const problems = cluster(reports);
        const all = problems.flatMap((p) => p.reportIds);
        // No report appears twice.
        expect(new Set(all).size).toBe(all.length);
        // Every input report appears.
        expect(new Set(all)).toEqual(new Set(reports.map((r) => r.id)));
        // reporterCount matches membership.
        for (const p of problems) {
          expect(p.reporterCount).toBe(p.reportIds.length);
        }
      }),
    );
  });

  it("is order-independent (same membership regardless of input order)", () => {
    fc.assert(
      fc.property(arbReports, fc.integer(), (reports, seed) => {
        const shuffled = [...reports].sort(
          (a, b) =>
            (Math.sin(seed + a.id.length) % 1) -
            (Math.sin(seed + b.id.length) % 1),
        );
        const a = membership(reports);
        const b = membership(shuffled);
        // Same partition: two reports share a problem in A iff they do in B.
        const ids = reports.map((r) => r.id);
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const together = a.get(ids[i]) === a.get(ids[j]);
            const togetherB = b.get(ids[i]) === b.get(ids[j]);
            expect(together).toBe(togetherB);
          }
        }
      }),
    );
  });

  it("is idempotent (re-clustering the same reports is stable)", () => {
    fc.assert(
      fc.property(arbReports, (reports) => {
        const once = membership(reports);
        const twice = membership(reports);
        expect([...twice.entries()].sort()).toEqual(
          [...once.entries()].sort(),
        );
      }),
    );
  });
});

describe("addReport() — property based", () => {
  it("a re-report never closes a problem and raises reporterCount", () => {
    fc.assert(
      fc.property(arbReport, (base) => {
        // Seed an open problem from one report.
        const first: Report = { ...base, id: "first" };
        const [problem] = cluster([first]);
        expect(problem.status).not.toBe("resolved");

        // A second report at the exact same spot and family, one day later.
        const reReport: Report = {
          ...base,
          id: "second",
          requestedAt: new Date(
            Date.parse(first.requestedAt) + 86_400_000,
          ).toISOString(),
        };
        const before = problem.reporterCount;
        const result = addReport(reReport, [problem]);

        expect(result.id).toBe(problem.id); // joined, not a new problem
        expect(result.reporterCount).toBe(before + 1);
        expect(result.status).not.toBe("resolved");
        expect(Date.parse(result.lastReportedAt)).toBeGreaterThanOrEqual(
          Date.parse(first.requestedAt),
        );
      }),
    );
  });
});
