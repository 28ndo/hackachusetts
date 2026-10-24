// The outcome protocol that replaces "Noted" (build-plan §6).

import type { OutcomeCode, OutcomeSpec } from "@/core/types";

export const OUTCOMES: Record<OutcomeCode, OutcomeSpec> = {
  FIXED: {
    label: "Fixed",
    nextStep: "The problem is marked resolved and watched for 30 days in case it comes back.",
    nextProblemStatus: "resolved",
    nextAssignmentState: "closed",
    needs: [],
    optional: ["photoUrl", "note"],
  },
  MADE_SAFE: {
    label: "Made safe",
    nextStep: "The problem stays open with a follow-up on the date you give.",
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    optional: [],
  },
  SCHEDULED: {
    label: "Scheduled",
    nextStep: "The work is marked in progress, with a nudge if the date passes.",
    nextProblemStatus: "in_progress",
    nextAssignmentState: "in_progress",
    needs: ["scheduledFor"],
    optional: [],
  },
  DEFERRED_CAPITAL: {
    label: "Needs a larger project",
    nextStep: "The problem is deferred to the target date and counted apart from failures.",
    nextProblemStatus: "deferred",
    nextAssignmentState: "closed",
    needs: ["scheduledFor"],
    optional: [],
  },
  NOT_OURS: {
    label: "Not ours",
    nextStep: "The packet goes to the owner you pick, and the system learns the rule for this spot.",
    nextProblemStatus: "routed",
    nextAssignmentState: "rerouted",
    needs: ["newOwnerId"],
    optional: ["note"],
  },
  NOT_FOUND: {
    label: "Couldn't find it",
    nextStep: "Every reporter is asked for a photo or confirmation; it closes if nobody replies in 7 days.",
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: [],
    optional: ["note"],
  },
  PRIVATE_PROPERTY: {
    label: "Private property",
    nextStep: "The problem closes and reporters are told who to contact.",
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    needs: [],
    optional: ["note"],
  },
  DUPLICATE: {
    label: "Duplicate",
    nextStep: "This packet closes and the reports are tracked on the other problem.",
    nextProblemStatus: "not_actionable",
    nextAssignmentState: "closed",
    needs: [],
    optional: ["note"],
  },
  NEEDS_INFO: {
    label: "Needs info",
    nextStep: "Your question goes to every reporter on this problem.",
    nextProblemStatus: "acknowledged",
    nextAssignmentState: "acknowledged",
    needs: ["note"],
    optional: [],
  },
};
