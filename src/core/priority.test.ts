import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { Entity, Problem } from "@/core/types";
import { priority } from "@/core/priority";

const NOW = new Date("2026-10-24T18:48:00Z");

const entity: Entity = {
  id: "test",
  name: "Test Entity",
  kind: "city_dept",
  queues: ["q"],
  owns: ["streetlight", "signal", "pothole"],
  hazard: { streetlight: 2, signal: 4, pothole: 3 },
  respondWithin: "48h",
};

function problemWith(opts: {
  family: string;
  reporterCount: number;
  firstReportedAt: string;
}): Problem {
  return {
    id: "p",
    serviceFamily: opts.family,
    lat: 42.3,
    lon: -71.1,
    neighborhood: "",
    reportIds: [],
    reporterCount: opts.reporterCount,
    firstReportedAt: opts.firstReportedAt,
    lastReportedAt: opts.firstReportedAt,
    status: "new",
    priority: {
      score: 0,
      hazard: 0,
      people: 0,
      overdue: 0,
      gap: 1,
      why: "",
    },
  };
}

describe("priority() — property based", () => {
  const arbCount = fc.integer({ min: 1, max: 500 });
  const arbAgeHours = fc.integer({ min: 0, max: 2000 });

  it("is monotonic non-decreasing in reporter count", () => {
    fc.assert(
      fc.property(arbCount, arbAgeHours, (count, ageH) => {
        const first = new Date(NOW.getTime() - ageH * 3_600_000).toISOString();
        const a = priority(
          problemWith({ family: "signal", reporterCount: count, firstReportedAt: first }),
          entity,
          NOW,
        );
        const b = priority(
          problemWith({ family: "signal", reporterCount: count + 1, firstReportedAt: first }),
          entity,
          NOW,
        );
        expect(b.score).toBeGreaterThanOrEqual(a.score - 1e-9);
      }),
    );
  });

  it("is monotonic non-decreasing in hazard (family with higher hazard)", () => {
    fc.assert(
      fc.property(arbCount, arbAgeHours, (count, ageH) => {
        const first = new Date(NOW.getTime() - ageH * 3_600_000).toISOString();
        const low = priority(
          problemWith({ family: "streetlight", reporterCount: count, firstReportedAt: first }),
          entity,
          NOW,
        ); // hazard 2
        const high = priority(
          problemWith({ family: "signal", reporterCount: count, firstReportedAt: first }),
          entity,
          NOW,
        ); // hazard 4
        expect(high.score).toBeGreaterThanOrEqual(low.score - 1e-9);
      }),
    );
  });

  it("is monotonic non-decreasing in overdue (older report scores at least as high)", () => {
    fc.assert(
      fc.property(arbCount, fc.integer({ min: 0, max: 1000 }), (count, ageH) => {
        const younger = new Date(NOW.getTime() - ageH * 3_600_000).toISOString();
        const older = new Date(NOW.getTime() - (ageH + 48) * 3_600_000).toISOString();
        const a = priority(
          problemWith({ family: "signal", reporterCount: count, firstReportedAt: younger }),
          entity,
          NOW,
        );
        const b = priority(
          problemWith({ family: "signal", reporterCount: count, firstReportedAt: older }),
          entity,
          NOW,
        );
        expect(b.score).toBeGreaterThanOrEqual(a.score - 1e-9);
      }),
    );
  });

  it("is bounded: factors within documented ranges", () => {
    fc.assert(
      fc.property(arbCount, arbAgeHours, (count, ageH) => {
        const first = new Date(NOW.getTime() - ageH * 3_600_000).toISOString();
        const p = priority(
          problemWith({ family: "signal", reporterCount: count, firstReportedAt: first }),
          entity,
          NOW,
        );
        expect(p.hazard).toBeGreaterThanOrEqual(1);
        expect(p.hazard).toBeLessThanOrEqual(5);
        expect(p.overdue).toBeGreaterThanOrEqual(1);
        expect(p.overdue).toBeLessThanOrEqual(3);
        expect(p.people).toBeGreaterThanOrEqual(1);
        expect(Number.isFinite(p.score)).toBe(true);
        // Upper bound: hazard 5 × overdue 3 × people(1+log2(count)).
        const maxPeople = 1 + Math.log2(count);
        expect(p.score).toBeLessThanOrEqual(5 * 3 * maxPeople + 1e-6);
      }),
    );
  });
});
