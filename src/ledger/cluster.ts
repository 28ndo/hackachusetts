import type { Problem, Report } from "@/core/types";

/**
 * Batch clustering for the seed: collapse raw reports into problems.
 *
 * TODO (P2, problem-ledger spec): implement the §3 clustering rule — same
 * serviceFamily, within 25 m (or same road segment), within 14 days of the
 * problem's last report, and the problem is not resolved. Order-independent
 * and idempotent.
 */
export function cluster(reports: Report[]): Problem[] {
  void reports;
  throw new Error("TODO: cluster() not implemented");
}

/**
 * Runtime clustering for the replay button: attach one report to a nearby open
 * problem, or start a new one.
 *
 * TODO (P2, problem-ledger spec): same §3 rule as cluster(). A re-report on an
 * open problem increments reporterCount and refreshes lastReportedAt; it never
 * closes anything.
 */
export function addReport(report: Report, nearbyOpen: Problem[]): Problem {
  void report;
  void nearbyOpen;
  throw new Error("TODO: addReport() not implemented");
}
