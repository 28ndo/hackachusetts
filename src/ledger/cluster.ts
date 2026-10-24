import type { Priority, Problem, Report } from "@/core/types";
import { familyOf } from "@/core/entities";
import { daysBetween, haversineMeters } from "@/ledger/geo";

// Clustering rule (build-plan §3):
//   same serviceFamily, AND
//   within 25 m OR on the same road segment, AND
//   within 14 days of the problem's last report, AND
//   the problem is not resolved.

const CLUSTER_RADIUS_M = 25;
const CLUSTER_WINDOW_DAYS = 14;

/** A neutral starting priority; real factors are filled by priority() later. */
function seedPriority(reporterCount: number): Priority {
  return {
    score: reporterCount,
    hazard: 1,
    people: reporterCount,
    overdue: 1,
    gap: 1,
    why: `${reporterCount} report(s) waiting`,
  };
}

function serviceFamilyOf(report: Report): string {
  return familyOf(report.serviceName);
}

/**
 * Does `report` belong to the open problem `p` under the §3 rule?
 *
 * A report carries no road segment of its own before enrichment, so the
 * "same road segment" arm reduces to the 25 m distance test here; segment
 * identity is preserved by proximity (points on one segment are close).
 */
function matches(report: Report, p: Problem, family: string): boolean {
  if (p.status === "resolved") return false;
  if (p.serviceFamily !== family) return false;
  if (daysBetween(report.requestedAt, p.lastReportedAt) > CLUSTER_WINDOW_DAYS) {
    return false;
  }
  return haversineMeters(report.lat, report.lon, p.lat, p.lon) <= CLUSTER_RADIUS_M;
}

function attach(report: Report, p: Problem): void {
  // Count up from the stored reporterCount: problems loaded from the database
  // carry the count but not their member ids. A report already in the problem
  // is not counted twice.
  if (!p.reportIds.includes(report.id)) {
    p.reportIds.push(report.id);
    p.reporterCount += 1;
  }
  if (Date.parse(report.requestedAt) < Date.parse(p.firstReportedAt)) {
    p.firstReportedAt = report.requestedAt;
  }
  if (Date.parse(report.requestedAt) > Date.parse(p.lastReportedAt)) {
    p.lastReportedAt = report.requestedAt;
  }
  p.priority = seedPriority(p.reporterCount);
  report.problemId = p.id;
}

function newProblem(report: Report, family: string): Problem {
  const id = `p-${report.id}`;
  report.problemId = id;
  return {
    id,
    serviceFamily: family,
    lat: report.lat,
    lon: report.lon,
    neighborhood: "",
    reportIds: [report.id],
    reporterCount: 1,
    firstReportedAt: report.requestedAt,
    lastReportedAt: report.requestedAt,
    status: "new",
    priority: seedPriority(1),
  };
}

/**
 * Batch clustering for the seed: collapse raw reports into problems.
 *
 * Reports are processed in chronological order so the "within 14 days of the
 * problem's last report" window is well-defined and the output is independent of
 * the input order. Each report joins the first open, same-family problem within
 * 25 m and 14 days, or starts a new problem.
 */
export function cluster(reports: Report[]): Problem[] {
  // Sort by time, breaking ties by id so the ordering — and therefore the
  // resulting partition — does not depend on the caller's input order.
  const ordered = [...reports].sort((a, b) => {
    const t = Date.parse(a.requestedAt) - Date.parse(b.requestedAt);
    return t !== 0 ? t : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const problems: Problem[] = [];

  for (const original of ordered) {
    const report = { ...original, problemId: undefined as string | undefined };
    const family = serviceFamilyOf(report);
    const home = problems.find((p) => matches(report, p, family));
    if (home) {
      attach(report, home);
    } else {
      problems.push(newProblem(report, family));
    }
    // Write the membership back onto the caller's report object too.
    original.problemId = report.problemId;
  }

  return problems;
}

/**
 * Runtime clustering for the replay button: attach one report to a nearby open
 * problem, or start a new one. Same §3 rule as cluster().
 *
 * A re-report on an open problem raises reporterCount and refreshes
 * lastReportedAt; it never closes anything. The matched problem is mutated and
 * returned; a brand-new problem is returned when nothing matches.
 */
export function addReport(report: Report, nearbyOpen: Problem[]): Problem {
  const family = serviceFamilyOf(report);
  const home = nearbyOpen.find((p) => matches(report, p, family));
  if (home) {
    attach(report, home);
    return home;
  }
  return newProblem(report, family);
}
