// Loads resident-facing outcome messages from data/locales/<locale>.json and
// interpolates {date}, {owner}, {note} placeholders (build-plan §5b, §6).
// Strings live in data, not in components, so adding a language is a data change.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { entityById } from "@/core/entities";
import type { Outcome, OutcomeCode } from "@/core/types";

export const SUPPORTED_LOCALES = ["en", "ht"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const localeSchema = z.object({
  _meta: z.object({ locale: z.string(), label: z.string() }).passthrough(),
  outcome: z.record(z.string(), z.string()),
});

type LocaleBundle = z.infer<typeof localeSchema>;

const cache = new Map<Locale, LocaleBundle>();

function bundle(locale: Locale): LocaleBundle {
  const cached = cache.get(locale);
  if (cached) return cached;
  const raw = readFileSync(
    join(process.cwd(), "data", "locales", `${locale}.json`),
    "utf8",
  );
  const parsed = localeSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(
      `data/locales/${locale}.json failed validation:\n${parsed.error.toString()}`,
    );
  }
  cache.set(locale, parsed.data);
  return parsed.data;
}

export function localeLabel(locale: Locale): string {
  return bundle(locale)._meta.label;
}

/** The raw template string for a code in a locale (placeholders intact). */
export function outcomeTemplate(code: OutcomeCode, locale: Locale): string {
  const tpl = bundle(locale).outcome[code];
  if (!tpl) {
    throw new Error(`Locale ${locale} is missing outcome message for ${code}`);
  }
  return tpl;
}

function ownerName(id: string | undefined): string {
  if (!id) return "the right department";
  return entityById(id)?.name ?? id;
}

/** Fill a template's placeholders from an Outcome. */
export function fillTemplate(template: string, outcome: Outcome): string {
  return template
    .replaceAll(
      "{date}",
      outcome.scheduledFor ??
        (outcome.code === "FIXED" ? outcome.at.slice(0, 10) : "a date to be confirmed"),
    )
    .replaceAll("{owner}", ownerName(outcome.newOwnerId))
    .replaceAll("{note}", outcome.note ?? "");
}

/** The resident message for an outcome in the given locale. */
export function residentMessageFor(
  code: OutcomeCode,
  outcome: Outcome,
  locale: Locale,
): string {
  return fillTemplate(outcomeTemplate(code, locale), outcome);
}
