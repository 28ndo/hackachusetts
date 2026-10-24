import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createFixtureRepo } from "@/workflow/fixtureRepo";
import { applyOutcome } from "@/workflow/applyOutcome";
import { route } from "@/core/routing/route";
import { loadEntities } from "@/core/entities";
import type { Outcome } from "@/core/types";

// Entities that could plausibly own a rerouted streetlight/pothole segment.
const NEW_OWNERS = ["massdot", "dcr", "eversource"] as const;

describe("applyOutcome() — NOT_OURS learns the route", () => {
  it("after NOT_OURS, route() returns the new owner for that segment", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...NEW_OWNERS), async (newOwnerId) => {
        const repo = createFixtureRepo();
        const entities = loadEntities();

        // The Morrissey streetlight fixture: a DCR jurisdiction problem with a
        // segment, assigned as "a-morrissey". Confirm it does NOT start on the
        // new owner (unless the new owner happens to own it by jurisdiction).
        const problem = await repo.getProblem("p-morrissey-streetlight");
        expect(problem).toBeDefined();

        const outcome: Outcome = {
          id: "o-reroute",
          assignmentId: "a-p-morrissey-streetlight",
          code: "NOT_OURS",
          newOwnerId,
          by: "dcr",
          at: "2026-10-24T18:48:00Z",
        };

        // Our seeded fixture assignment id is "a-morrissey", not keyed to the
        // problem id, so drive applyOutcome with a problem-keyed id and seed a
        // matching assignment first.
        await repo.createAssignment({
          id: "a-p-morrissey-streetlight",
          problemId: "p-morrissey-streetlight",
          entityId: "dcr",
          attempt: 1,
          sentAt: "2026-10-10T05:00:00Z",
          respondBy: "2026-10-12T05:00:00Z",
          resolveBy: "2026-10-25T05:00:00Z",
          routingReason: "DCR segment",
          confidence: "jurisdiction",
          state: "sent",
        });

        const change = await applyOutcome(repo, outcome.assignmentId, outcome);
        expect(change.learnedOverride).toBeDefined();
        expect(change.newAssignmentId).toBeDefined();

        // route() with the learned overrides now returns the new owner.
        const overrides = await repo.listOverrides();
        const decision = route(problem!, { entities, overrides });
        expect(decision.entityId).toBe(newOwnerId);
        expect(decision.confidence).toBe("learned");
      }),
    );
  });

  it("FIXED resolves the problem and closes the assignment", async () => {
    const repo = createFixtureRepo();
    await repo.createAssignment({
      id: "a-p-vfw-streetlight",
      problemId: "p-vfw-streetlight",
      entityId: "dcr",
      attempt: 1,
      sentAt: "2026-10-07T21:00:00Z",
      respondBy: "2026-10-09T21:00:00Z",
      resolveBy: "2026-10-24T21:00:00Z",
      routingReason: "DCR parkway",
      confidence: "jurisdiction",
      state: "sent",
    });
    const change = await applyOutcome(repo, "a-p-vfw-streetlight", {
      id: "o-fixed",
      assignmentId: "a-p-vfw-streetlight",
      code: "FIXED",
      photoUrl: "https://example.com/fix.jpg",
      by: "dcr",
      at: "2026-10-24T18:48:00Z",
    });
    expect(change.nextProblemStatus).toBe("resolved");
    expect(change.nextAssignmentState).toBe("closed");
    expect(change.residentMessage.length).toBeGreaterThan(0);

    const after = await repo.getProblem("p-vfw-streetlight");
    expect(after!.status).toBe("resolved");
  });
});
