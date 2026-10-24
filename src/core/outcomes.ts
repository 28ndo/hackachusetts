import type { OutcomeCode, OutcomeSpec } from "@/core/types";

/**
 * The protocol that replaces "Noted" (§6): every code maps to a next problem
 * status, a next assignment state, and a plain-language resident message.
 *
 * TODO (P3, routing-and-priority spec): fill in every code with the §6 next
 * steps and grade-8 resident message templates. Placeholders ({date}, {owner})
 * get filled from the Outcome. Keep English keys in sync with data/locales.
 */
export const OUTCOMES: Record<OutcomeCode, OutcomeSpec> = {
  FIXED: {
    nextProblemStatus: "resolved",
    nextAssignmentState: "closed",
    residentMessage: () => "TODO: resident message for FIXED",
  },
  MADE_SAFE: {
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    residentMessage: () => "TODO: resident message for MADE_SAFE",
  },
  SCHEDULED: {
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    residentMessage: () => "TODO: resident message for SCHEDULED",
  },
  DEFERRED_CAPITAL: {
    nextProblemStatus: "deferred",
    nextAssignmentState: "closed",
    needs: ["scheduledFor"],
    residentMessage: () => "TODO: resident message for DEFERRED_CAPITAL",
  },
  NOT_OURS: {
    nextProblemStatus: "routed",
    nextAssignmentState: "rerouted",
    needs: ["newOwnerId"],
    residentMessage: () => "TODO: resident message for NOT_OURS",
  },
  NOT_FOUND: {
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: ["note"],
    residentMessage: () => "TODO: resident message for NOT_FOUND",
  },
  PRIVATE_PROPERTY: {
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    residentMessage: () => "TODO: resident message for PRIVATE_PROPERTY",
  },
  DUPLICATE: {
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    needs: ["note"],
    residentMessage: () => "TODO: resident message for DUPLICATE",
  },
  NEEDS_INFO: {
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: ["note"],
    residentMessage: () => "TODO: resident message for NEEDS_INFO",
  },
};
