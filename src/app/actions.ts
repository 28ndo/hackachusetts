"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRepo } from "@/db/getRepo";
import { applyOutcome } from "@/workflow/applyOutcome";
import { replayNext } from "@/workflow/ingest";
import { OUTCOME_CODES } from "@/core/types";
import type { OutcomeCode } from "@/core/types";

function field(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

export async function recordOutcomeAction(formData: FormData): Promise<void> {
  const assignmentId = field(formData, "assignmentId") ?? "";
  const entityId = field(formData, "entityId");
  const rawCode = field(formData, "code");
  const base = `/packet/${encodeURIComponent(assignmentId)}`;

  if (!rawCode || !OUTCOME_CODES.includes(rawCode as OutcomeCode)) {
    redirect(`${base}?error=${encodeURIComponent("Pick an outcome first.")}`);
  }
  const code = rawCode as OutcomeCode;

  let target: string;
  try {
    const change = await applyOutcome(getRepo(), {
      assignmentId,
      code,
      note: field(formData, "note"),
      photoUrl: field(formData, "photoUrl"),
      scheduledFor: field(formData, "scheduledFor"),
      newOwnerId: field(formData, "newOwnerId"),
      by: entityId,
    });
    target = `${base}?done=${code}&next=${encodeURIComponent(change.newAssignment?.id ?? "")}`;
    revalidatePath("/");
    revalidatePath("/ledger");
    if (entityId) revalidatePath(`/inbox/${entityId}`);
    if (change.newAssignment) revalidatePath(`/inbox/${change.newAssignment.entityId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not record the outcome.";
    target = `${base}?error=${encodeURIComponent(msg)}`;
  }
  redirect(target);
}

export async function replayNextAction(formData: FormData): Promise<void> {
  const entityId = field(formData, "entityId") ?? "triage";
  const base = `/inbox/${encodeURIComponent(entityId)}`;
  let target: string;
  try {
    const r = await replayNext(getRepo());
    if (!r) {
      target = `${base}?error=${encodeURIComponent("No more held-back reports to replay.")}`;
    } else {
      const q = new URLSearchParams({
        replayed: r.assignment.id,
        landed: r.assignment.entityId,
        joined: r.joinedExisting ? "1" : "0",
        confidence: r.assignment.confidence,
      });
      target = `${base}?${q.toString()}`;
      revalidatePath("/");
    revalidatePath("/ledger");
      revalidatePath(base);
      revalidatePath(`/inbox/${r.assignment.entityId}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Replay failed.";
    target = `${base}?error=${encodeURIComponent(msg)}`;
  }
  redirect(target);
}
