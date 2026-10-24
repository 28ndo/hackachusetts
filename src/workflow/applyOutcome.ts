import type { Outcome, Repo, StateChange } from "@/core/types";

/**
 * Apply an entity's structured outcome to the ledger and return what changed.
 *
 * TODO (Niklas, entity-workflow spec): implement the §6 next steps per code.
 * NOT_OURS closes the current assignment as "rerouted", creates an assignment
 * for the chosen entity, and stores a RoutingOverride. Every code produces a
 * resident message from OUTCOMES in the reporter's preferredLanguage.
 */
export async function applyOutcome(
  repo: Repo,
  assignmentId: string,
  outcome: Outcome,
): Promise<StateChange> {
  void repo;
  void assignmentId;
  void outcome;
  throw new Error("TODO: applyOutcome() not implemented");
}
