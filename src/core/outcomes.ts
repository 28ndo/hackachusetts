import type { Outcome, OutcomeCode, OutcomeSpec } from "@/core/types";
import { residentMessageFor } from "@/core/locales";

// The protocol that replaces "Noted" (build-plan §6): every code maps to a next
// problem status, a next assignment state, the extra inputs it needs, and a
// grade-8 resident message. residentMessage() returns English; the UI calls
// residentMessageFor() directly to switch between en and ht.

function en(code: OutcomeCode) {
  return (outcome: Outcome) => residentMessageFor(code, outcome, "en");
}

export const OUTCOMES: Record<OutcomeCode, OutcomeSpec> = {
  FIXED: {
    nextProblemStatus: "resolved",
    nextAssignmentState: "closed",
    residentMessage: en("FIXED"),
  },
  MADE_SAFE: {
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    residentMessage: en("MADE_SAFE"),
  },
  SCHEDULED: {
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    residentMessage: en("SCHEDULED"),
  },
  DEFERRED_CAPITAL: {
    nextProblemStatus: "deferred",
    nextAssignmentState: "closed",
    needs: ["scheduledFor"],
    residentMessage: en("DEFERRED_CAPITAL"),
  },
  NOT_OURS: {
    nextProblemStatus: "routed",
    nextAssignmentState: "rerouted",
    needs: ["newOwnerId"],
    residentMessage: en("NOT_OURS"),
  },
  NOT_FOUND: {
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: ["note"],
    residentMessage: en("NOT_FOUND"),
  },
  PRIVATE_PROPERTY: {
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    residentMessage: en("PRIVATE_PROPERTY"),
  },
  DUPLICATE: {
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    needs: ["note"],
    residentMessage: en("DUPLICATE"),
  },
  NEEDS_INFO: {
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: ["note"],
    residentMessage: en("NEEDS_INFO"),
  },
};
