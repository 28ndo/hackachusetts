"use client";

import { useState } from "react";
import type { OutcomeCode } from "@/core/types";
import { submitOutcome } from "@/app/actions";
import { ResidentPreview } from "@/components/ResidentPreview";

// The 9 one-tap outcome buttons (build-plan §6). Codes that need input reveal a
// small inline form (date, owner picker, or note) before submitting. Each
// submit posts to the submitOutcome server action. Below the form, the resident
// preview shows the picked code's message, filled live from the form inputs.

interface OwnerOption {
  id: string;
  name: string;
}

interface Props {
  assignmentId: string;
  entityId: string;
  owners: OwnerOption[]; // candidates for a NOT_OURS reroute
  templates: Record<OutcomeCode, { en: string; ht: string }>;
  localeLabels: { en: string; ht: string };
}

type Field = "scheduledFor" | "newOwnerId" | "note";

const CODES: { code: OutcomeCode; label: string; fields: Field[] }[] = [
  { code: "FIXED", label: "Fixed", fields: [] },
  { code: "MADE_SAFE", label: "Made safe", fields: ["scheduledFor"] },
  { code: "SCHEDULED", label: "Scheduled", fields: ["scheduledFor"] },
  { code: "DEFERRED_CAPITAL", label: "Deferred (capital)", fields: ["scheduledFor"] },
  { code: "NOT_OURS", label: "Not ours → reroute", fields: ["newOwnerId"] },
  { code: "NOT_FOUND", label: "Not found", fields: ["note"] },
  { code: "PRIVATE_PROPERTY", label: "Private property", fields: [] },
  { code: "DUPLICATE", label: "Duplicate", fields: ["note"] },
  { code: "NEEDS_INFO", label: "Needs info", fields: ["note"] },
];

export function OutcomeButtons({ assignmentId, entityId, owners, templates, localeLabels }: Props) {
  const [active, setActive] = useState<OutcomeCode | null>(null);
  const [date, setDate] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [note, setNote] = useState("");
  const current = CODES.find((c) => c.code === active);

  // Same placeholders and fallbacks as fillTemplate() in src/core/locales.ts,
  // which builds the message actually stored with the outcome.
  const fill = (tpl: string) =>
    tpl
      .replaceAll("{date}", date || "a date to be confirmed")
      .replaceAll("{owner}", owners.find((o) => o.id === ownerId)?.name ?? "the right department")
      .replaceAll("{note}", note);
  const preview = active
    ? { en: fill(templates[active].en), ht: fill(templates[active].ht) }
    : null;

  return (
    <section aria-labelledby="outcomes-heading" className="space-y-3">
      <h3 id="outcomes-heading" className="text-sm font-semibold">
        Record the outcome
      </h3>
      <div className="flex flex-wrap gap-2">
        {CODES.map(({ code, label, fields }) => (
          <button
            key={code}
            type="button"
            aria-expanded={fields.length > 0 ? active === code : undefined}
            onClick={() => setActive(active === code ? null : code)}
            className="min-h-[36px] rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            {label}
          </button>
        ))}
      </div>

      {current && (
        <form
          action={submitOutcome}
          className="space-y-3 rounded-md border border-neutral-300 p-3 dark:border-neutral-700"
        >
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="code" value={current.code} />

          <p className="text-sm font-medium">{current.label}</p>

          {current.fields.includes("scheduledFor") && (
            <label className="block text-sm">
              <span className="mb-1 block">Date / target</span>
              <input
                type="date"
                name="scheduledFor"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
              />
            </label>
          )}

          {current.fields.includes("newOwnerId") && (
            <label className="block text-sm">
              <span className="mb-1 block">New owner</span>
              <select
                name="newOwnerId"
                required
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Pick the real owner…
                </option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {current.fields.includes("note") && (
            <label className="block text-sm">
              <span className="mb-1 block">Note</span>
              <textarea
                name="note"
                rows={2}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
              />
            </label>
          )}

          <button
            type="submit"
            className="min-h-[36px] rounded-md bg-blue-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Submit outcome (demo)
          </button>
        </form>
      )}

      <ResidentPreview messages={preview} labels={localeLabels} />
    </section>
  );
}
