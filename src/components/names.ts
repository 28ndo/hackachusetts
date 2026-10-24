import { entityName } from "@/core/entities";
import { TRIAGE_ID } from "@/core/types";

/** entityName, with the ops triage pseudo-entity handled. */
export function nameOf(id?: string): string {
  if (!id) return "—";
  return id === TRIAGE_ID ? "Ops triage" : entityName(id);
}
