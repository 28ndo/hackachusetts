import { describe, it, expect } from "vitest";
import type { Repo } from "@/core/types";
import { loadEntities } from "@/core/entities";
import { route } from "@/core/routing/route";
import { createFixtureRepo } from "@/workflow/fixtureRepo";
import { applyOutcome } from "@/workflow/applyOutcome";

async function morrissey(repo: Repo) {
  const item = (await repo.listInbox("dcr")).find((i) => i.problem.roadSegmentId === "seg-morrissey-1");
  if (!item) throw new Error("Morrissey packet missing from the DCR inbox");
  return item;
}

describe("applyOutcome", () => {
  it("NOT_OURS reroutes and learns", async () => {
    const repo = createFixtureRepo();
    const item = await morrissey(repo);
    const change = await applyOutcome(repo, { assignmentId: item.assignment.id, code: "NOT_OURS", newOwnerId: "massdot" });

    expect((await repo.getAssignment(item.assignment.id))?.state).toBe("rerouted");
    expect(change.newAssignment).toMatchObject({ entityId: "massdot", attempt: 2, state: "sent", confidence: "learned" });
    expect(await repo.getAssignment(change.newAssignment!.id)).toBeDefined();
    expect(change.residentMessage).toContain("Massachusetts Department of Transportation");

    const problem = (await repo.getProblem(item.problem.id))!;
    const d = route(problem, { entities: loadEntities(), overrides: await repo.listOverrides() });
    expect(d).toMatchObject({ entityId: "massdot", confidence: "learned" });
    expect(d.reason).toContain("Learned: Department of Conservation and Recreation");
  });

  it("FIXED resolves", async () => {
    const repo = createFixtureRepo();
    const item = await morrissey(repo);
    const change = await applyOutcome(repo, { assignmentId: item.assignment.id, code: "FIXED" });
    expect((await repo.getProblem(item.problem.id))?.status).toBe("resolved");
    expect((await repo.getAssignment(item.assignment.id))?.state).toBe("closed");
    expect(change.residentMessage).toMatch(/^Fixed on \d{4}-\d{2}-\d{2}/);
    await expect(applyOutcome(repo, { assignmentId: item.assignment.id, code: "FIXED" })).rejects.toThrow(/already closed/);
  });

  it("SCHEDULED without a date throws", async () => {
    const repo = createFixtureRepo();
    const item = await morrissey(repo);
    await expect(applyOutcome(repo, { assignmentId: item.assignment.id, code: "SCHEDULED" })).rejects.toThrow("SCHEDULED needs a date");
  });
});
