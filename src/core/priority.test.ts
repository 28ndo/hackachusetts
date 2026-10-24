import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { Entity, Problem } from "@/core/types";
import { priority } from "@/core/priority";

const NOW = new Date("2026-10-24T18:00:00Z");

const problemArb = fc.record({
  reporterCount: fc.integer({ min: 1, max: 200 }),
  hoursAgo: fc.integer({ min: 0, max: 24 * 60 }),
  family: fc.constantFrom("streetlight", "pothole", "signal", "wire", "tree", "litter"),
});

const make = (x: { reporterCount: number; hoursAgo: number; family: string }): Problem => ({
  id: "p",
  serviceFamily: x.family,
  lat: 42.3,
  lon: -71.05,
  address: "",
  reportIds: [],
  reporterCount: x.reporterCount,
  firstReportedAt: new Date(NOW.getTime() - x.hoursAgo * 3_600_000).toISOString(),
  lastReportedAt: NOW.toISOString(),
  status: "routed",
  priority: { score: 0, hazard: 1, people: 1, overdue: 1, gap: 1, why: "" },
});

const entityWith = (family: string, hazard: number): Entity => ({
  id: "e",
  name: "E",
  kind: "city_dept",
  queues: [],
  owns: [family],
  hazard: { [family]: hazard },
  respondWithin: "48h",
});

describe("priority", () => {
  it("is monotonic in reporterCount", () => {
    fc.assert(
      fc.property(problemArb, fc.integer({ min: 0, max: 50 }), (x, more) => {
        expect(priority(make({ ...x, reporterCount: x.reporterCount + more }), undefined, NOW).score).toBeGreaterThanOrEqual(
          priority(make(x), undefined, NOW).score,
        );
      }),
    );
  });

  it("is monotonic in hazard", () => {
    fc.assert(
      fc.property(problemArb, fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), (x, a, b) => {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        expect(priority(make(x), entityWith(x.family, hi), NOW).score).toBeGreaterThanOrEqual(
          priority(make(x), entityWith(x.family, lo), NOW).score,
        );
      }),
    );
  });

  it("is monotonic in now", () => {
    fc.assert(
      fc.property(problemArb, fc.integer({ min: 0, max: 24 * 30 }), (x, laterHours) => {
        const later = new Date(NOW.getTime() + laterHours * 3_600_000);
        expect(priority(make(x), undefined, later).score).toBeGreaterThanOrEqual(priority(make(x), undefined, NOW).score);
      }),
    );
  });

  it("is bounded", () => {
    fc.assert(
      fc.property(problemArb, fc.double({ min: 1, max: 1.5, noNaN: true }), (x, gap) => {
        const p = priority(make(x), undefined, NOW, gap);
        expect(p.overdue).toBeLessThanOrEqual(3);
        expect(p.hazard).toBeLessThanOrEqual(5);
        expect(p.score).toBeLessThanOrEqual(5 * (1 + Math.log2(x.reporterCount * gap)) * 3 + 0.05);
      }),
    );
  });

  it("gap acts only through the reporter count, and never lowers priority", () => {
    fc.assert(
      fc.property(problemArb, fc.double({ min: 1, max: 1.5, noNaN: true }), (x, gap) => {
        const withGap = priority(make(x), undefined, NOW, gap);
        const scaled = priority(make({ ...x, reporterCount: x.reporterCount * gap }), undefined, NOW, 1);
        expect(withGap.score).toBe(scaled.score);
        expect(withGap.score).toBeGreaterThanOrEqual(priority(make(x), undefined, NOW).score);
      }),
    );
  });

  it("explains itself", () => {
    const p = priority(make({ reporterCount: 7, hoursAgo: 48 + 9 * 24, family: "pothole" }), undefined, NOW, 1.25);
    expect(p.why).toBe("7 people waiting · 9 days overdue · hazard 3 · low-reporting area");
  });
});
