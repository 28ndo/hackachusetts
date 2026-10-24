// npm run db:smoke — read-path check against the seeded v2 schema.
import { PostgresRepo } from "@/db/repo";
import { getSql } from "@/db/client";

async function main() {
  const repo = new PostgresRepo();
  const o = await repo.overview();
  console.log("overview", {
    totalReports: o.totalReports,
    routableReports: o.routableReports,
    totalProblems: o.totalProblems,
    routedProblems: o.routedProblems,
    triageProblems: o.triageProblems,
    duplicateShare: o.duplicateShare.toFixed(3),
    cityNotedShare: o.cityNotedShare.toFixed(3),
    days: o.reportsByDay.length,
    outcomesRecorded: o.outcomesRecorded,
    replayRemaining: o.replayRemaining,
  });
  console.log("byFamily", o.byFamily);
  console.log("entities", o.entities);
  console.log("topClusters", o.topClusters.slice(0, 3));

  let firstDcr: string | undefined;
  for (const entity of ["dcr", "pwd-street-lighting"]) {
    const inbox = await repo.listInbox(entity);
    console.log(`\ninbox ${entity}: ${inbox.length} items`);
    for (const it of inbox.slice(0, 5)) {
      console.log(
        `  #${it.rank} score=${it.problem.priority.score.toFixed(2)} ${it.problem.priority.why} | ${it.problem.address} | ${it.assignment.routingReason} (${it.assignment.confidence})${it.overdue ? " OVERDUE" : ""}`,
      );
    }
    if (entity === "dcr") firstDcr = inbox[0]?.problem.id;
    if (entity === "dcr" && inbox[0]) {
      const packet = await repo.getPacket(inbox[0].assignment.id);
      console.log(`  packet ${inbox[0].assignment.id}: ${packet?.reports.length} reports, history ${packet?.history.length}`);
    }
  }

  if (firstDcr) {
    const p = (await repo.getProblem(firstDcr))!;
    const near = await repo.listOpenProblemsNear(p.lat, p.lon, p.serviceFamily, 25);
    console.log(`\nnear first dcr problem (${p.id}, ${p.serviceFamily}, 25 m): ${near.map((x) => x.id).join(", ")}`);
  }
  const sc = await repo.scorecard();
  console.log("scorecard rows", sc.length);
  await getSql().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
