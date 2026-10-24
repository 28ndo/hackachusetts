import { describe, it, expect } from "vitest";
import type { Outcome, OutcomeCode } from "@/core/types";
import { OUTCOMES } from "@/core/outcomes";
import { SUPPORTED_LOCALES, outcomeTemplate, residentMessageFor } from "@/core/locales";

const CODES = Object.keys(OUTCOMES) as OutcomeCode[];

function sampleOutcome(code: OutcomeCode): Outcome {
  return {
    id: "o1",
    assignmentId: "a1",
    code,
    note: "send a photo",
    scheduledFor: "2026-11-03",
    newOwnerId: "massdot",
    by: "tester",
    at: "2026-10-24T18:48:00Z",
  };
}

// Placeholders present in a template, e.g. {date}, {owner}.
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe("OUTCOMES — protocol completeness", () => {
  it("there are exactly 9 codes, each with next states", () => {
    expect(CODES.length).toBe(9);
    for (const code of CODES) {
      const spec = OUTCOMES[code];
      expect(spec.nextProblemStatus).toBeTruthy();
      expect(spec.nextAssignmentState).toBeTruthy();
    }
  });

  it("every code has a resident message in every supported locale", () => {
    for (const code of CODES) {
      for (const locale of SUPPORTED_LOCALES) {
        const msg = residentMessageFor(code, sampleOutcome(code), locale);
        expect(typeof msg).toBe("string");
        expect(msg.length).toBeGreaterThan(0);
        // Placeholders must have been filled in (none left behind).
        expect(msg).not.toMatch(/\{(date|owner|note)\}/);
      }
    }
  });

  it("every code's templates share the same placeholders across locales", () => {
    for (const code of CODES) {
      const en = placeholders(outcomeTemplate(code, "en"));
      for (const locale of SUPPORTED_LOCALES) {
        expect(placeholders(outcomeTemplate(code, locale))).toEqual(en);
      }
    }
  });

  it("OUTCOMES.residentMessage returns the English message", () => {
    for (const code of CODES) {
      const o = sampleOutcome(code);
      expect(OUTCOMES[code].residentMessage(o)).toBe(
        residentMessageFor(code, o, "en"),
      );
    }
  });
});
