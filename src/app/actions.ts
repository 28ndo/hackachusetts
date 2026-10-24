"use server";

import { revalidatePath } from "next/cache";
import type { Outcome, OutcomeCode } from "@/core/types";
import { getRepo } from "@/db/getRepo";
import { applyOutcome } from "@/workflow/applyOutcome";
import { route } from "@/core/routing/route";
import { loadEntities } from "@/core/entities";

// Server actions behind the inbox UI (dispatch-ledger §9, §10). Every write goes
// through getRepo(); nothing calls an external system (demo mode).

/** Record one of the 9 outcomes for an assignment. */
export async function submitOutcome(formData: FormData): Promise<void> {
  const repo = getRepo();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const code = String(formData.get("code") ?? "") as OutcomeCode;

  const outcome: Outcome = {
    id: `o-${assignmentId}-${Date.now()}`,
    assignmentId,
    code,
    note: str(formData.get("note")),
    photoUrl: str(formData.get("photoUrl")),
    scheduledFor: str(formData.get("scheduledFor")),
    newOwnerId: str(formData.get("newOwnerId")),
    by: entityId,
    at: new Date().toISOString(),
  };

  await applyOutcome(repo, assignmentId, outcome);
  revalidatePath(`/inbox/${entityId}`);
  revalidatePath("/");
}

export interface ReplayResult {
  landedEntityId: string;
  landedEntityName: string;
  confidence: string;
  reason: string;
  address: string;
}

/** Pop the next held-back report and ingest it; report where it landed. */
export async function replayNext(): Promise<ReplayResult | null> {
  const repo = getRepo();
  const report = await repo.nextReplayReport();
  if (!report) return null;

  const problem = await repo.ingestReport(report);

  // Describe the landing: re-run route() to read back the confidence/reason,
  // which is "learned" when a NOT_OURS override now covers this segment.
  const entities = loadEntities();
  const overrides = await repo.listOverrides();
  const decision = route(problem, { entities, overrides });
  const owner = entities.find((e) => e.id === decision.entityId);

  revalidatePath("/");
  if (owner) revalidatePath(`/inbox/${owner.id}`);

  return {
    landedEntityId: decision.entityId,
    landedEntityName: owner?.name ?? decision.entityId,
    confidence: decision.confidence,
    reason: decision.reason,
    address: report.address,
  };
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : undefined;
}
