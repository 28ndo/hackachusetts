// Language helpers (build-plan §5b). Boston's intake already auto-translates and tags reports:
//   "-- auto translated (en) --\n<English>\n-- original (zh-hans-US) --\n<original>"

import { LOCALES, type Locale } from "@/core/types";

const TAGGED = /--\s*auto translated\s*\(([^)]*)\)\s*--([\s\S]*?)--\s*original\s*\(([^)]*)\)\s*--([\s\S]*)/i;

function mapLocale(tag: string): Locale {
  const t = tag.trim().toLowerCase();
  if (t.startsWith("zh")) return "zh";
  if (t.startsWith("es")) return "es";
  if (t.startsWith("ht")) return "ht";
  return "en";
}

export function parseReportText(description: string | undefined): {
  text?: string;
  originalText?: string;
  preferredLanguage: string;
} {
  const m = description?.match(TAGGED);
  if (!m) return { text: description?.trim() || undefined, preferredLanguage: "en" };
  return {
    text: m[2].trim() || undefined,
    originalText: m[4].trim() || undefined,
    preferredLanguage: mapLocale(m[3]),
  };
}

const LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ht: "Kreyòl ayisyen",
  zh: "中文 (简体)",
};

export function normalizeLocale(x: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(x ?? "") ? (x as Locale) : "en";
}

export function localeLabel(locale: string): string {
  return LABELS[normalizeLocale(locale)];
}
