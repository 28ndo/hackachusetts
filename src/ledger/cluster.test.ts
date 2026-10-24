import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { ProblemStatus, Report } from "@/core/types";
import { addReport, cluster, newProblemFrom } from "@/ledger/cluster";

const FAMILIES = ["streetlight", "pothole", "signal"];
const BASE = Date.parse("2026-10-01T00:00:00Z");

// Reports packed into a small area and a few weeks so clusters actually form.
const reportArb = fc.record({
  family: fc.constantFrom(...FAMILIES),
  dLat: fc.integer({ min: 0, max: 40 }),
  dLon: fc.integer({ min: 0, max: 40 }),
  hours: fc.integer({ min: 0, max: 24 * 40 }),
  seg: fc.option(fc.constantFrom("seg-a", "seg-b"), { nil: undefined }),
});

const reportsArb = fc.array(reportArb, { minLength: 1, maxLength: 60 }).map((rows) =>
  rows.map(
    (r, i): Report => ({
      id: `r-${i}`,
      source: "open311",
      serviceName: r.family,
      serviceFamily: r.family,
      lat: 42.3 + r.dLat * 0.0001,
      lon: -71.05 + r.dLon * 0.0001,
      address: "somewhere",
      mediaUrls: [],
      requestedAt: new Date(BASE + r.hours * 3_600_000).toISOString(),
      preferredLanguage: "en",
      roadSegmentId: r.seg,
    }),
  ),
);

const copy = (rs: Report[]) => rs.map((r) => ({ ...r, problemId: undefined }));
const summary = (rs: Report[]) => {
  const ps = cluster(rs);
  return { ids: ps.map((p) => p.id).sort(), byReport: Object.fromEntries(rs.map((r) => [r.id, r.problemId])) };
};

describe("cluster", () => {
  it("puts every report in exactly one problem", () => {
    fc.assert(
      fc.property(reportsArb, (rs) => {
        const ps = cluster(rs);
        const all = ps.flatMap((p) => p.reportIds);
        expect(all.sort()).toEqual(rs.map((r) => r.id).sort());
        for (const r of rs) expect(ps.find((p) => p.id === r.problemId)?.reportIds).toContain(r.id);
        for (const p of ps) expect(p.reporterCount).toBe(p.reportIds.length);
      }),
    );
  });

  it("is order-independent", () => {
    fc.assert(
      fc.property(reportsArb, fc.integer(), (rs, seed) => {
        const shuffled = copy(rs).sort((a, b) => ((a.id.length * seed + a.id.charCodeAt(2)) % 7) - ((b.id.length * seed + b.id.charCodeAt(2)) % 7));
        expect(summary(copy(shuffled))).toEqual(summary(copy(rs)));
      }),
    );
  });

  it("is idempotent", () => {
    fc.assert(
      fc.property(reportsArb, (rs) => {
        const first = cluster(rs).map((p) => p.id).sort();
        expect(cluster(copy(rs)).map((p) => p.id).sort()).toEqual(first);
      }),
    );
  });

  it("clusters 3,500 reports quickly", () => {
    const rs: Report[] = Array.from({ length: 3500 }, (_, i) => ({
      id: `x-${i}`,
      source: "open311",
      serviceName: "Pothole",
      serviceFamily: FAMILIES[i % 3],
      lat: 42.25 + (i % 97) * 0.001,
      lon: -71.15 + (i % 89) * 0.001,
      address: "",
      mediaUrls: [],
      requestedAt: new Date(BASE + i * 600_000).toISOString(),
      preferredLanguage: "en",
    }));
    const t = performance.now();
    cluster(rs);
    expect(performance.now() - t).toBeLessThan(1000);
  });
});

describe("addReport", () => {
  it("a re-report never changes status and increments reporterCount", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ProblemStatus>("new", "routed", "acknowledged", "in_progress", "deferred"),
        fc.integer({ min: 0, max: 20 }),
        (status, meters) => {
          const base: Report = {
            id: "a",
            source: "open311",
            serviceName: "Pothole",
            serviceFamily: "pothole",
            lat: 42.3,
            lon: -71.05,
            address: "x",
            mediaUrls: [],
            requestedAt: "2026-10-01T00:00:00Z",
            preferredLanguage: "en",
          };
          const problem = { ...newProblemFrom(base), status };
          const again = { ...base, id: "b", lat: 42.3 + meters / 111_000, requestedAt: "2026-10-05T00:00:00Z" };
          const { problem: p, joinedExisting } = addReport(again, [problem]);
          expect(joinedExisting).toBe(true);
          expect(p.status).toBe(status);
          expect(p.reporterCount).toBe(2);
          expect(p.lastReportedAt).toBe(again.requestedAt);
          expect(again.problemId).toBe(p.id);
        },
      ),
    );
  });
});
