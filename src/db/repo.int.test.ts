// Integration test for PostgresRepo (dispatch-ledger Req 7.4).
//
// Runs only when TEST_DATABASE_URL is set, never against DATABASE_URL: it
// applies db/schema.sql, which drops every table, so pointing it at the demo
// database would wipe the seeded demo. Use a separate Neon branch for it.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { PostgresRepo } from "@/db/repo";
import type { Assignment, Report } from "@/core/types";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("PostgresRepo (integration)", () => {
  const sql = postgres(url!, { prepare: false });
  const repo = new PostgresRepo(sql);

  beforeAll(async () => {
    const ddl = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
    await sql.unsafe(ddl);
  });

  afterAll(async () => {
    await sql.end();
  });

  it("writes and reads back an open assignment, hidden once closed", async () => {
    await sql`
      insert into problems
        (id, service_family, lat, lon, reporter_count, first_reported_at,
         last_reported_at, status, priority)
      values ('p-int-1', 'streetlight', 42.3, -71.05, 1,
              '2026-10-10T00:00:00Z', '2026-10-10T00:00:00Z', 'new',
              ${sql.json({ score: 1, hazard: 1, people: 1, overdue: 1, gap: 1, why: "" })})
      on conflict (id) do nothing`;

    const assignment: Assignment = {
      id: "a-int-1",
      problemId: "p-int-1",
      entityId: "dcr",
      attempt: 1,
      sentAt: "2026-10-10T01:00:00Z",
      respondBy: "2026-10-12T01:00:00Z",
      resolveBy: "2026-10-24T01:00:00Z",
      routingReason: "test",
      confidence: "jurisdiction",
      state: "sent",
    };
    await repo.createAssignment(assignment);

    const inbox = await repo.listInbox("dcr");
    expect(inbox.map((a) => a.id)).toContain("a-int-1");

    await repo.updateAssignment("a-int-1", { state: "closed" });
    const afterClose = await repo.listInbox("dcr");
    expect(afterClose.map((a) => a.id)).not.toContain("a-int-1");
  });

  it("pops held-back reports from the replay queue in order", async () => {
    type JsonArg = Parameters<typeof sql.json>[0];
    const r1: Report = {
      id: "rq-1",
      source: "open311",
      serviceName: "Pothole",
      lat: 42.31,
      lon: -71.08,
      address: "somewhere",
      requestedAt: "2026-10-20T00:00:00Z",
    };
    const r2: Report = { ...r1, id: "rq-2" };
    await sql`insert into replay_queue (payload, label) values (${sql.json(r1 as unknown as JsonArg)}, 'first')`;
    await sql`insert into replay_queue (payload, label) values (${sql.json(r2 as unknown as JsonArg)}, 'second')`;

    const first = await repo.nextReplayReport();
    const second = await repo.nextReplayReport();
    const third = await repo.nextReplayReport();

    expect(first?.id).toBe("rq-1");
    expect(second?.id).toBe("rq-2");
    expect(third).toBeUndefined();
  });
});
