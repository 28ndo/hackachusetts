// Clustering: many reports → one problem (build-plan §3).
// Rule: same family, within 25 m (or the same road segment and within 150 m), reported within
// 14 days of the problem's last report, and the problem is still open.

import { createHash } from "node:crypto";
import type { Problem, Report } from "@/core/types";
import { daysBetween, haversineMeters } from "@/ledger/geo";

export const CLUSTER_RADIUS_M = 25;
export const CLUSTER_WINDOW_DAYS = 14;
export const REOPEN_WINDOW_DAYS = 30;
const SEGMENT_RADIUS_M = 150;
/** Grid cell in degrees: ~220 m north-south, ~165 m east-west, so a 3×3 block covers 150 m. */
const CELL_DEG = 0.002;

const isOpen = (p: Problem) => p.status !== "resolved" && p.status !== "not_actionable";

function problemIdFor(reportId: string): string {
  return "p-" + createHash("sha1").update(reportId).digest("hex").slice(0, 12);
}

export function newProblemFrom(report: Report): Problem {
  return {
    id: problemIdFor(report.id),
    serviceFamily: report.serviceFamily,
    lat: report.lat,
    lon: report.lon,
    address: report.address,
    roadSegmentId: report.roadSegmentId,
    roadName: report.roadName,
    jurisdictionCode: report.jurisdictionCode,
    reportIds: [report.id],
    reporterCount: 1,
    firstReportedAt: report.requestedAt,
    lastReportedAt: report.requestedAt,
    status: "new",
    priority: { score: 0, hazard: 1, people: 1, overdue: 1, gap: 1, why: "" },
  };
}

/** Distance to the problem when the report may join it, else undefined. */
function joinDistance(report: Report, problem: Problem): number | undefined {
  if (problem.serviceFamily !== report.serviceFamily || !isOpen(problem)) return undefined;
  if (daysBetween(report.requestedAt, problem.lastReportedAt) > CLUSTER_WINDOW_DAYS) return undefined;
  const d = haversineMeters(report.lat, report.lon, problem.lat, problem.lon);
  const sameSegment = !!report.roadSegmentId && report.roadSegmentId === problem.roadSegmentId;
  return d <= CLUSTER_RADIUS_M || (sameSegment && d <= SEGMENT_RADIUS_M) ? d : undefined;
}

function nearest(report: Report, candidates: Problem[]): Problem | undefined {
  let best: Problem | undefined;
  let bestD = Infinity;
  for (const p of candidates) {
    const d = joinDistance(report, p);
    if (d !== undefined && d < bestD) [best, bestD] = [p, d];
  }
  return best;
}

function join(report: Report, problem: Problem): void {
  if (!problem.reportIds.includes(report.id)) {
    problem.reportIds.push(report.id);
    problem.reporterCount++;
  }
  if (report.requestedAt > problem.lastReportedAt) problem.lastReportedAt = report.requestedAt;
  report.problemId = problem.id;
}

/** Batch clustering for the seed. Sets report.problemId; result is independent of input order. */
export function cluster(reports: Report[]): Problem[] {
  const sorted = [...reports].sort((a, b) =>
    a.requestedAt === b.requestedAt ? a.id.localeCompare(b.id) : a.requestedAt.localeCompare(b.requestedAt),
  );
  const grid = new Map<string, Problem[]>();
  const cell = (lat: number, lon: number) => [Math.floor(lat / CELL_DEG), Math.floor(lon / CELL_DEG)];
  const problems: Problem[] = [];

  for (const report of sorted) {
    const [cy, cx] = cell(report.lat, report.lon);
    const candidates: Problem[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        candidates.push(...(grid.get(`${report.serviceFamily}|${cy + dy}|${cx + dx}`) ?? []));
      }
    }
    const target = nearest(report, candidates);
    if (target) {
      join(report, target);
      continue;
    }
    const problem = newProblemFrom(report);
    report.problemId = problem.id;
    problems.push(problem);
    const key = `${report.serviceFamily}|${cy}|${cx}`;
    const bucket = grid.get(key);
    if (bucket) bucket.push(problem);
    else grid.set(key, [problem]);
  }
  return problems;
}

/** Runtime version: nearbyOpen is already family-filtered and within range. Never changes status. */
export function addReport(report: Report, nearbyOpen: Problem[]): { problem: Problem; joinedExisting: boolean } {
  const target = nearest(report, nearbyOpen);
  if (target) {
    join(report, target);
    return { problem: target, joinedExisting: true };
  }
  const problem = newProblemFrom(report);
  report.problemId = problem.id;
  return { problem, joinedExisting: false };
}
