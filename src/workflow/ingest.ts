// Ingest one new report at runtime: cluster it, route it, open or reuse a packet (build-plan §3, §5).

import { TRIAGE_ID, type Assignment, type Repo, type Report, type ReplayResult, type RoutingDecision } from "@/core/types";
import { loadEntities } from "@/core/entities";
import { priority } from "@/core/priority";
import { route } from "@/core/routing/route";
import { addReport } from "@/ledger/cluster";
import { buildAssignment } from "@/workflow/assign";

const MAX_ATTEMPTS = 10;
const isActive = (a: Assignment) => a.state !== "closed" && a.state !== "rerouted";

export async function ingestReport(repo: Repo, report: Report, now = new Date()): Promise<ReplayResult> {
  const entities = loadEntities();
  const nearby = await repo.listOpenProblemsNear(report.lat, report.lon, report.serviceFamily, 150);
  const { problem, joinedExisting } = addReport(report, nearby);

  if (joinedExisting) {
    // Highest attempt wins; reuse it when still active.
    let latest: Assignment | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      latest = (await repo.getAssignment(`a-${problem.id}-${attempt}`)) ?? latest;
    }
    let assignment = latest && isActive(latest) ? latest : undefined;
    let decision: RoutingDecision;
    if (assignment) {
      decision = { entityId: assignment.entityId, reason: assignment.routingReason, confidence: assignment.confidence, missing: [] };
    } else {
      const reports = [...(await repo.listReports(problem.id)), report];
      decision = route(problem, { entities, overrides: await repo.listOverrides(), reports });
      assignment = buildAssignment(problem, decision, entities, (latest?.attempt ?? 0) + 1, now);
      await repo.createAssignment(assignment);
    }
    problem.priority = priority(problem, entities.find((e) => e.id === assignment.entityId), now);
    await repo.attachReport(report, problem);
    await repo.updateProblem(problem.id, {
      reporterCount: problem.reporterCount,
      lastReportedAt: problem.lastReportedAt,
      reportIds: problem.reportIds,
      priority: problem.priority,
    });
    return { report, problem, assignment, joinedExisting, decision };
  }

  const decision = route(problem, { entities, overrides: await repo.listOverrides(), reports: [report] });
  problem.priority = priority(problem, entities.find((e) => e.id === decision.entityId), now);
  problem.status = decision.entityId === TRIAGE_ID ? "new" : "routed";
  await repo.createProblem(problem);
  await repo.attachReport(report, problem);
  const assignment = buildAssignment(problem, decision, entities, 1, now);
  await repo.createAssignment(assignment);
  return { report, problem, assignment, joinedExisting, decision };
}

export async function replayNext(repo: Repo, now = new Date()): Promise<ReplayResult | undefined> {
  const report = await repo.nextReplayReport();
  return report ? ingestReport(repo, report, now) : undefined;
}
