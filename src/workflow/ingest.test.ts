import { describe, it, expect } from "vitest";
import { createFixtureRepo } from "@/workflow/fixtureRepo";
import { applyOutcome } from "@/workflow/applyOutcome";
import { replayNext } from "@/workflow/ingest";

describe("replayNext", () => {
  it("lands the held-back Morrissey report at MassDOT once DCR said NOT_OURS", async () => {
    const repo = createFixtureRepo();
    const item = (await repo.listInbox("dcr")).find((i) => i.problem.roadSegmentId === "seg-morrissey-1")!;
    await applyOutcome(repo, { assignmentId: item.assignment.id, code: "NOT_OURS", newOwnerId: "massdot" });

    const result = await replayNext(repo, new Date("2026-10-24T18:00:00Z"));
    expect(result).toBeDefined();
    expect(result!.assignment.entityId).toBe("massdot");
    expect(result!.decision.confidence).toBe("learned");
    expect(await replayNext(repo)).toBeUndefined();
    expect((await repo.listInbox("massdot")).some((i) => i.problem.id === result!.problem.id)).toBe(true);
  });
});
