// Resident messages per outcome code (build-plan §5b, §6). Static JSON imports so this
// works in Next.js server components without fs.

import en from "../../data/locales/en.json";
import es from "../../data/locales/es.json";
import ht from "../../data/locales/ht.json";
import zh from "../../data/locales/zh.json";
import { LOCALES, type Locale, type OutcomeCode } from "@/core/types";
import { normalizeLocale } from "@/core/language";

interface LocaleFile {
  _meta: { locale: string; label: string; note: string };
  outcome: Record<OutcomeCode, string>;
}

const FILES: Record<Locale, LocaleFile> = { en, es, ht, zh };

export function outcomeTemplate(code: OutcomeCode, locale: string): string {
  return FILES[normalizeLocale(locale)].outcome[code] ?? FILES.en.outcome[code];
}

export function residentMessage(
  code: OutcomeCode,
  locale: string,
  vars: { date?: string; owner?: string; note?: string; contact?: string },
): string {
  const values: Record<string, string> = {
    date: vars.date || "a date to be confirmed",
    owner: vars.owner || "the right agency",
    note: vars.note || "",
    contact: vars.contact || "311",
  };
  return outcomeTemplate(code, locale)
    .replace(/\{(date|owner|note|contact)\}/g, (_, k: string) => values[k])
    .trim();
}

export function allLocales(): { locale: Locale; label: string }[] {
  return LOCALES.map((locale) => ({ locale, label: FILES[locale]._meta.label }));
}
