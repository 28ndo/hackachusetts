// In-memory Repo seeded from real demo records. Lets the UI and tests run with no database.
// Assignments are produced by route() / priority() / buildAssignment(), not hand-written.

import {
  TRIAGE_ID,
  type Assignment,
  type HistoryEvent,
  type InboxItem,
  type Outcome,
  type Overview,
  type Packet,
  type Problem,
  type Report,
  type Repo,
  type RoutingOverride,
  type ScorecardRow,
} from "@/core/types";
import { entityName, loadEntities, NOT_ROUTED } from "@/core/entities";
import { OUTCOMES } from "@/core/outcomes";
import { priority } from "@/core/priority";
import { missingItems, route } from "@/core/routing/route";
import { FIXTURE_NOW, fixtureReplayReports, fixtureReports } from "@/core/fixtures";
import { cluster, REOPEN_WINDOW_DAYS } from "@/ledger/cluster";
import { daysBetween, haversineMeters } from "@/ledger/geo";
import { buildAssignment } from "@/workflow/assign";

const clone = <T>(x: T): T => structuredClone(x);
const isActive = (a: Assignment) => a.state !== "closed" && a.state !== "rerouted";
const isOpen = (p: Problem) => p.status !== "resolved" && p.status !== "not_actionable";
const median = (xs: number[]) => {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function createFixtureRepo(): Repo {
  const entities = loadEntities();
  const reports = new Map<string, Report>();
  const problems = new Map<string, Problem>();
  const assignments = new Map<string, Assignment>();
  const outcomes: Outcome[] = [];
  const overrides: RoutingOverride[] = [];
  const replayQueue = fixtureReplayReports();

  // Seed: cluster → route → priority → assignment.
  const seeded = fixtureReports();
  for (const r of seeded) reports.set(r.id, r);
  const now = new Date(FIXTURE_NOW);
  for (const problem of cluster(seeded)) {
    const own = problem.reportIds.map((id) => reports.get(id)!);
    const decision = route(problem, { entities, overrides, reports: own });
    problem.priority = priority(problem, entities.find((e) => e.id === decision.entityId), now);
    problem.status = decision.entityId === TRIAGE_ID ? "new" : "routed";
    problems.set(problem.id, problem);
    const a = buildAssignment(problem, decision, entities, 1, new Date(problem.firstReportedAt));
    assignments.set(a.id, a);
  }

  const assignmentsOf = (problemId: string) =>
    [...assignments.values()].filter((a) => a.problemId === problemId).sort((a, b) => a.attempt - b.attempt);
  const currentAssignment = (problemId: string) => assignmentsOf(problemId).filter(isActive).at(-1);
  const reportsOf = (p: Problem) => p.reportIds.map((id) => reports.get(id)).filter((r): r is Report => !!r);
  const isOverdue = (a: Assignment, at: Date) => a.state === "sent" && Date.parse(a.respondBy) < at.getTime();
  const nonEnglish = (p: Problem) => reportsOf(p).some((r) => r.preferredLanguage !== "en");
  const entityIds = [...entities.map((e) => e.id), TRIAGE_ID];

  return {
    async overview(): Promise<Overview> {
      const at = new Date();
      const all = [...reports.values()];
      const routable = all.filter((r) => r.serviceFamily !== NOT_ROUTED);
      const probs = [...problems.values()];
      const current = probs.map((p) => ({ p, a: currentAssignment(p.id) }));
      const notes = all.map((r) => r.cityStatusNotes).filter((n): n is string => !!n);
      const days = new Map<string, number>();
      for (const r of all) days.set(r.requestedAt.slice(0, 10), (days.get(r.requestedAt.slice(0, 10)) ?? 0) + 1);
      const families = [...new Set(all.map((r) => r.serviceFamily))].sort();
      const active = [...assignments.values()].filter(isActive);
      return {
        totalReports: all.length,
        routableReports: routable.length,
        totalProblems: probs.length,
        routedProblems: current.filter(({ a }) => a && a.entityId !== TRIAGE_ID).length,
        triageProblems: current.filter(({ a }) => a?.entityId === TRIAGE_ID).length,
        duplicateShare: routable.length ? (routable.length - probs.length) / routable.length : 0,
        cityNotedShare: notes.length ? notes.filter((n) => n.startsWith("Noted")).length / notes.length : 0,
        reportsByDay: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count })),
        byFamily: families.map((family) => ({
          family,
          reports: all.filter((r) => r.serviceFamily === family).length,
          problems: probs.filter((p) => p.serviceFamily === family).length,
        })),
        entities: entityIds.map((entityId) => {
          const mine = active.filter((a) => a.entityId === entityId);
          return {
            entityId,
            open: mine.length,
            overdue: mine.filter((a) => isOverdue(a, at)).length,
            nonEnglish: mine.filter((a) => nonEnglish(problems.get(a.problemId)!)).length,
          };
        }),
        topClusters: current
          .filter((x): x is { p: Problem; a: Assignment } => !!x.a)
          .sort((x, y) => y.p.reporterCount - x.p.reporterCount)
          .slice(0, 5)
          .map(({ p, a }) => ({
            problemId: p.id,
            serviceFamily: p.serviceFamily,
            address: p.address,
            reporterCount: p.reporterCount,
            entityId: a.entityId,
            assignmentId: a.id,
            cityNoteBefore: reportsOf(p).find((r) => r.cityStatusNotes)?.cityStatusNotes,
          })),
        learnedRules: clone(overrides),
        outcomesRecorded: outcomes.length,
        replayRemaining: replayQueue.length,
      };
    },

    async listInbox(entityId, limit = 50, filter = {}): Promise<InboxItem[]> {
      const at = new Date();
      return [...assignments.values()]
        .filter((a) => a.entityId === entityId && isActive(a))
        .map((a) => ({ a, p: problems.get(a.problemId)! }))
        .filter(({ p }) => !filter.nonEnglish || reportsOf(p).some((r) => r.preferredLanguage !== "en"))
        .sort((x, y) => y.p.priority.score - x.p.priority.score)
        .slice(0, limit)
        .map(({ a, p }, i) => {
          const rs = reportsOf(p);
          const photos = rs.flatMap((r) => r.mediaUrls);
          return {
            rank: i + 1,
            assignment: clone(a),
            problem: clone(p),
            description: rs.find((r) => r.description)?.description,
            photoCount: photos.length,
            firstPhotoUrl: photos[0],
            reporterLanguages: [...new Set(rs.map((r) => r.preferredLanguage))],
            overdue: isOverdue(a, at),
          };
        });
    },

    async getPacket(assignmentId): Promise<Packet | undefined> {
      const assignment = assignments.get(assignmentId);
      const problem = assignment && problems.get(assignment.problemId);
      if (!assignment || !problem) return undefined;
      const rs = reportsOf(problem);
      const hops = assignmentsOf(problem.id);
      const outs = outcomes.filter((o) => hops.some((h) => h.id === o.assignmentId));
      const history: HistoryEvent[] = [
        ...rs.map((r) => ({ at: r.requestedAt, kind: "report" as const, text: `Reported: ${r.address}` })),
        ...hops.map((h) => ({
          at: h.sentAt,
          kind: "assignment" as const,
          text: `Sent to ${entityName(h.entityId)} (${h.routingReason})`,
          entityId: h.entityId,
          confidence: h.confidence,
        })),
        ...outs.map((o) => {
          const by = hops.find((h) => h.id === o.assignmentId)!.entityId;
          return {
            at: o.at,
            kind: "outcome" as const,
            text: `${entityName(by)}: ${OUTCOMES[o.code].label}${o.note ? ` (${o.note})` : ""}`,
            entityId: by,
            code: o.code,
          };
        }),
      ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      return {
        assignment: clone(assignment),
        problem: clone(problem),
        reports: clone(rs),
        history,
        outcomes: clone(outs),
        missing: missingItems(entities.find((e) => e.id === assignment.entityId), rs),
      };
    },

    async getProblem(id) {
      const p = problems.get(id);
      return p && clone(p);
    },
    async getAssignment(id) {
      const a = assignments.get(id);
      return a && clone(a);
    },
    async listReports(problemId) {
      const p = problems.get(problemId);
      return p ? clone(reportsOf(p)) : [];
    },
    async listOverrides() {
      return clone(overrides);
    },

    async scorecard(): Promise<ScorecardRow[]> {
      const at = new Date();
      return entityIds.map((entityId) => {
        const mine = [...assignments.values()].filter((a) => a.entityId === entityId);
        const outs = outcomes.filter((o) => mine.some((a) => a.id === o.assignmentId));
        const count = (code: Outcome["code"]) => outs.filter((o) => o.code === code).length;
        const handled = [...new Set(mine.map((a) => a.problemId))];
        const reopened = handled.filter((pid) => {
          const fixedAt = outs.find((o) => o.code === "FIXED" && assignments.get(o.assignmentId)?.problemId === pid)?.at;
          if (!fixedAt) return false;
          return reportsOf(problems.get(pid)!).some(
            (r) => r.requestedAt > fixedAt && daysBetween(r.requestedAt, fixedAt) <= REOPEN_WINDOW_DAYS,
          );
        });
        const responseHours = mine.flatMap((a) => {
          const first = outs.filter((o) => o.assignmentId === a.id).map((o) => o.at).sort()[0];
          return first ? [(Date.parse(first) - Date.parse(a.sentAt)) / 3_600_000] : [];
        });
        const active = mine.filter(isActive);
        return {
          entityId,
          open: active.length,
          overdue: active.filter((a) => isOverdue(a, at)).length,
          answered: outs.length,
          fixed: count("FIXED"),
          rerouted: count("NOT_OURS"),
          notFound: count("NOT_FOUND"),
          deferred: count("DEFERRED_CAPITAL"),
          reopenRate: handled.length ? reopened.length / handled.length : 0,
          medianResponseHours: median(responseHours),
        };
      });
    },

    async listOpenProblemsNear(lat, lon, serviceFamily, meters) {
      return [...problems.values()]
        .filter((p) => p.serviceFamily === serviceFamily && isOpen(p) && haversineMeters(lat, lon, p.lat, p.lon) <= meters)
        .map(clone);
    },

    async createAssignment(a) {
      assignments.set(a.id, clone(a));
    },
    async updateAssignment(id, patch) {
      const a = assignments.get(id);
      if (a) assignments.set(id, { ...a, ...clone(patch) });
    },
    async updateProblem(id, patch) {
      const p = problems.get(id);
      if (p) problems.set(id, { ...p, ...clone(patch) });
    },
    async recordOutcome(o) {
      outcomes.push(clone(o));
    },
    async addOverride(o) {
      overrides.push(clone(o));
    },
    async attachReport(report, problem) {
      reports.set(report.id, { ...clone(report), problemId: problem.id });
      const p = problems.get(problem.id);
      if (!p) return;
      if (!p.reportIds.includes(report.id)) p.reportIds = [...p.reportIds, report.id];
      p.reporterCount = p.reportIds.length;
      if (report.requestedAt > p.lastReportedAt) p.lastReportedAt = report.requestedAt;
    },
    async createProblem(problem) {
      problems.set(problem.id, clone(problem));
    },

    async nextReplayReport() {
      return replayQueue.shift();
    },
  };
}

export const fixtureRepo: Repo = createFixtureRepo();
