import { loadEntities } from "@/core/entities";
import { allLocales, outcomeTemplate } from "@/core/locales";
import { OUTCOMES } from "@/core/outcomes";
import { OUTCOME_CODES, type Locale, type OutcomeCode } from "@/core/types";
import { ResidentView } from "@/components/ResidentView";

export const dynamic = "force-dynamic";

// The resident view: the intake side (a stub of an agentic report form) and the
// return path (every message a resident can get back, in their language).
export default function ResidentPage() {
  const locales = allLocales();
  const templates = Object.fromEntries(
    OUTCOME_CODES.map((c) => [c, Object.fromEntries(locales.map((l) => [l.locale, outcomeTemplate(c, l.locale)]))]),
  ) as Record<OutcomeCode, Record<Locale, string>>;
  const specs = Object.fromEntries(
    OUTCOME_CODES.map((c) => [c, { label: OUTCOMES[c].label, nextStep: OUTCOMES[c].nextStep }]),
  ) as Record<OutcomeCode, { label: string; nextStep: string }>;
  const entities = loadEntities().map((e) => ({ id: e.id, name: e.name, owns: e.owns, respondWithin: e.respondWithin }));

  return <ResidentView locales={locales} templates={templates} specs={specs} entities={entities} />;
}
