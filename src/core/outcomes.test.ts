import { describe, it, expect } from "vitest";
import { LOCALES, OUTCOME_CODES } from "@/core/types";
import { OUTCOMES } from "@/core/outcomes";
import { outcomeTemplate, residentMessage } from "@/core/locales";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("outcome protocol", () => {
  it.each(OUTCOME_CODES)("%s has next states, a label and a step", (code) => {
    const spec = OUTCOMES[code];
    expect(spec.label).toBeTruthy();
    expect(spec.nextStep).toBeTruthy();
    expect(spec.nextProblemStatus).toBeTruthy();
    expect(spec.nextAssignmentState).toBeTruthy();
  });

  it.each(OUTCOME_CODES)("%s has a message in every locale with English's placeholders", (code) => {
    const en = placeholders(outcomeTemplate(code, "en"));
    for (const locale of LOCALES) {
      const t = outcomeTemplate(code, locale);
      expect(t.length).toBeGreaterThan(0);
      expect(placeholders(t)).toEqual(en);
      expect(residentMessage(code, locale, {})).not.toMatch(/\{\w+\}/);
    }
  });

  it("fills defaults", () => {
    expect(residentMessage("SCHEDULED", "en", {})).toContain("a date to be confirmed");
    expect(residentMessage("NOT_OURS", "en", {})).toContain("the right agency");
    expect(residentMessage("PRIVATE_PROPERTY", "en", {})).toContain("311");
  });
});
