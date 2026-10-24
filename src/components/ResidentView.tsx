"use client";

import { useState } from "react";
import type { Locale, OutcomeCode } from "@/core/types";
import { fillTemplate } from "@/components/fill";
import { Card } from "@/components/ui";

interface EntityLite {
  id: string;
  name: string;
  owns: string[];
  respondWithin?: string;
}

interface Props {
  locales: { locale: Locale; label: string }[];
  templates: Record<OutcomeCode, Record<Locale, string>>;
  specs: Record<OutcomeCode, { label: string; nextStep: string }>;
  entities: EntityLite[];
}

// Keyword guess for the stub form only; the real router runs on the server.
const FAMILY_WORDS: [string, RegExp][] = [
  ["pothole", /pothole|hole in the (road|street)|crater/i],
  ["streetlight", /street ?light|lamp|light (is )?out|dark/i],
  ["sidewalk", /sidewalk|pavement|curb/i],
  ["tree", /tree|branch|limb/i],
  ["signal", /signal|traffic light|stuck on red/i],
  ["sign", /\bsign\b|stop sign/i],
  ["wire", /wire|cable|pole down/i],
];
const FAMILY_LABEL: Record<string, string> = {
  pothole: "Pothole", streetlight: "Streetlight", sidewalk: "Sidewalk", tree: "Street tree",
  signal: "Traffic signal", sign: "Sign", wire: "Wire / pole",
};
const FOLLOW_UP: Record<string, string> = {
  pothole: "How big is it, roughly: a dinner plate, a tire, or bigger?",
  streetlight: "Is there a number tag on the pole? If not, the nearest house number is enough.",
  sidewalk: "In front of which house number? Is it a tripping hazard?",
  tree: "Is it on wires or blocking the road?",
  signal: "Which light is out, and which street does it face?",
  sign: "Which sign, and which corner of the intersection?",
  wire: "Is it sparking or on the ground? If yes, call 911 first.",
};

const DEMO_OUTCOME_VARS: Partial<Record<OutcomeCode, { date?: string; owner?: string; note?: string; contact?: string }>> = {
  FIXED: { date: new Date().toISOString().slice(0, 10) },
  SCHEDULED: { date: "2026-11-03" },
  MADE_SAFE: { date: "2026-11-10" },
  DEFERRED_CAPITAL: { date: "spring 2027" },
  NOT_OURS: { owner: "MassDOT" },
  NEEDS_INFO: { note: "the pole number, or the nearest house number" },
  PRIVATE_PROPERTY: { contact: "the property owner (the city can send a notice)" },
};

export function ResidentView({ locales, templates, specs, entities }: Props) {
  const [locale, setLocale] = useState<Locale>("en");
  const [text, setText] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const family = FAMILY_WORDS.find(([, re]) => re.test(text))?.[0];
  // City department first; the real router only picks DCR/MassDOT when the road is theirs.
  const owner = family
    ? entities.find((e) => e.owns.includes(family) && !["dcr", "massdot"].includes(e.id))
    : undefined;
  const hasPhoto = false;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Resident view</p>
          <h1 className="text-2xl font-semibold tracking-tight">Report it once. Hear back in plain words, in your language.</h1>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Language</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="min-h-9 rounded-md border border-line bg-surface px-2"
          >
            {locales.map((l) => (
              <option key={l.locale} value={l.locale}>{l.label}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Report a problem</h2>
          <p className="mt-1 text-xs text-muted">
            A stub of an agentic intake: one box, the agent asks the one follow-up the crew needs, and the ledger does the rest.
            Today&apos;s 311 form is a 9-step wizard with a category tree. Nothing is filed from here (demo mode).
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label className="block">
              <span className="text-sm font-medium">What&apos;s wrong?</span>
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setSubmitted(false); }}
                rows={3}
                placeholder="e.g. Street light out in front of 239 Savin Hill Ave, has been dark for a week"
                className="mt-1 w-full rounded-md border border-line bg-surface p-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Where? <span className="font-normal text-muted">(the agent can use your location)</span></span>
              <input
                value={address}
                onChange={(e) => { setAddress(e.target.value); setSubmitted(false); }}
                placeholder="Address or intersection"
                className="mt-1 w-full rounded-md border border-line bg-surface p-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Photo <span className="font-normal text-muted">(optional)</span></span>
              <input type="file" accept="image/*" className="mt-1 block text-sm text-muted" />
            </label>

            {family && (
              <div className="rounded-md border border-accent/40 bg-accent-soft p-3 text-sm" role="status">
                <p><strong>Agent:</strong> Sounds like a {FAMILY_LABEL[family].toLowerCase()}. {FOLLOW_UP[family]}</p>
                {!hasPhoto && <p className="mt-1 text-muted">A photo helps the crew find it, but you can send it without one.</p>}
              </div>
            )}

            <button type="submit" className="min-h-10 rounded-md bg-accent px-4 font-medium text-white dark:text-black hover:opacity-90">
              Send (demo)
            </button>
          </form>

          {submitted && (
            <div className="mt-4 rounded-md border border-good/40 bg-good-soft p-3 text-sm">
              <p className="font-medium">Here is what the ledger would do with it</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  {family
                    ? <>Classified as <strong>{FAMILY_LABEL[family]}</strong>{address ? ` at ${address}` : ""}.</>
                    : <>Held for ops triage: the agent would ask one more question to classify it.</>}
                </li>
                <li>Checked against open problems nearby: if someone already reported it, you join theirs and the owner sees one more person waiting.</li>
                <li>
                  {owner
                    ? <>Routed to <strong>{owner.name}</strong> (or the state agency if the road is theirs), with a reason attached.</>
                    : <>Routed to its owner with a reason attached.</>}
                </li>
                <li>You hear back {owner?.respondWithin ? `within ${owner.respondWithin}` : "within 48h"}, in {locales.find((l) => l.locale === locale)?.label}, with one of the nine answers below. Never just &ldquo;Noted&rdquo;.</li>
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">What you can hear back</h2>
          <p className="mt-1 text-xs text-muted">
            Nine structured outcomes replace the free-text closure. Each one is translated once and reviewed once.
            Machine-drafted, pending city language review. Sent by app notification, or as an SMS if you called.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {(Object.keys(specs) as OutcomeCode[]).map((code) => (
              <li key={code} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">{specs[code].label}</span>
                  <span className="text-[11px] text-muted">{code}</span>
                </div>
                <p className="mt-0.5">{fillTemplate(templates[code][locale], DEMO_OUTCOME_VARS[code] ?? {})}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
