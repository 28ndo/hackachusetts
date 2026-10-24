"use client";

import { useState } from "react";
import { recordOutcomeAction } from "@/app/actions";
import type { Locale, OutcomeCode, OutcomeInput } from "@/core/types";
import { fillTemplate } from "./fill";

export interface OutcomeOption {
  code: OutcomeCode;
  label: string;
  nextStep: string;
  needs: OutcomeInput[];
  optional: OutcomeInput[];
}

interface Props {
  assignmentId: string;
  entityId: string;
  outcomes: OutcomeOption[];
  owners: { id: string; name: string }[];
  locales: { locale: Locale; label: string }[];
  defaultLocale: Locale;
  templates: Record<OutcomeCode, Record<Locale, string>>;
  today: string;
}

const INPUT = "mt-1 block w-full min-h-10 rounded-md border border-line bg-surface px-2 text-sm text-ink";

export function OutcomePanel({ assignmentId, entityId, outcomes, owners, locales, defaultLocale, templates, today }: Props) {
  const [code, setCode] = useState<OutcomeCode | undefined>();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [scheduledFor, setScheduledFor] = useState("");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const spec = outcomes.find((o) => o.code === code);
  const asks = (k: OutcomeInput) => !!spec && (spec.needs.includes(k) || spec.optional.includes(k));
  const req = (k: OutcomeInput) => !!spec && spec.needs.includes(k);
  const tag = (k: OutcomeInput) => (req(k) ? " (required)" : " (optional)");

  const ownerName = owners.find((o) => o.id === newOwnerId)?.name;
  const date = scheduledFor || (code === "FIXED" ? today : "");
  const preview = code
    ? fillTemplate(templates[code]?.[locale] ?? templates[code]?.en ?? "", { date, owner: ownerName, note, contact: note })
    : "";

  return (
    <form action={recordOutcomeAction} className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-base font-semibold">Record the outcome</h2>
      <p className="mt-0.5 text-xs text-muted">One structured answer. No free-text “Noted”.</p>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="code" value={code ?? ""} />

      <fieldset className="mt-3">
        <legend className="sr-only">Outcome</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {outcomes.map((o) => {
            const on = o.code === code;
            return (
              <button
                key={o.code}
                type="button"
                aria-pressed={on}
                onClick={() => setCode(o.code)}
                className={`min-h-11 rounded-md border px-1.5 py-1 text-xs font-medium leading-tight ${
                  on ? "border-accent bg-accent text-white dark:text-black" : "border-line bg-surface-2 hover:border-accent"
                }`}
              >
                {on && <span aria-hidden>✓ </span>}
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {spec && (
        <div className="mt-3 space-y-3">
          <p className="rounded-md bg-surface-2 px-2 py-1.5 text-xs text-muted">
            <span className="font-medium text-ink">Next:</span> {spec.nextStep}
          </p>
          {asks("scheduledFor") && (
            <label className="block text-xs font-medium">
              Date{tag("scheduledFor")}
              <input name="scheduledFor" required={req("scheduledFor")} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} placeholder="2026-11-03 or spring 2027" className={INPUT} />
            </label>
          )}
          {asks("newOwnerId") && (
            <label className="block text-xs font-medium">
              Real owner{tag("newOwnerId")}
              <select name="newOwnerId" required={req("newOwnerId")} value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} className={INPUT}>
                <option value="">Choose the owner…</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          )}
          {asks("note") && (
            <label className="block text-xs font-medium">
              Note{tag("note")}
              <textarea name="note" required={req("note")} value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${INPUT} py-1.5`} />
            </label>
          )}
          {asks("photoUrl") && (
            <label className="block text-xs font-medium">
              Photo link{tag("photoUrl")}
              <input name="photoUrl" type="url" required={req("photoUrl")} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" className={INPUT} />
            </label>
          )}

          <div className="rounded-md border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2 py-1.5">
              <span className="text-xs font-semibold">Resident preview</span>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Preview language">
                {locales.map((l) => (
                  <button
                    key={l.locale}
                    type="button"
                    aria-pressed={l.locale === locale}
                    onClick={() => setLocale(l.locale)}
                    className={`min-h-7 rounded px-2 text-[11px] font-medium ${l.locale === locale ? "bg-ink text-surface" : "bg-surface-2 text-muted hover:text-ink"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <p lang={locale} aria-live="polite" className="px-3 py-3 text-base leading-snug">
              {preview}
            </p>
            <p className="border-t border-line px-2 py-1.5 text-[11px] text-muted">
              Machine-drafted, pending city language review · sent by app notification, or as an SMS to phone reporters
            </p>
          </div>

          <button type="submit" className="min-h-11 w-full rounded-md bg-accent px-3 font-semibold text-white dark:text-black hover:opacity-90">
            Record {spec.label}
          </button>
        </div>
      )}
    </form>
  );
}
