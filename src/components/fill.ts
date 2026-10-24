import { fmtDay } from "./format";

export interface FillVars {
  date?: string;
  owner?: string;
  note?: string;
  contact?: string;
}

/** Fill a resident-message template. Same fallbacks as residentMessage() in core/locales. */
export function fillTemplate(template: string, v: FillVars): string {
  const date = v.date?.trim();
  const shownDate = date ? (/^\d{4}-\d{2}-\d{2}$/.test(date) ? fmtDay(date) : date) : "a date to be confirmed";
  return template
    .replaceAll("{date}", shownDate)
    .replaceAll("{owner}", v.owner?.trim() || "the right agency")
    .replaceAll("{note}", v.note?.trim() || "")
    .replaceAll("{contact}", v.contact?.trim() || "311")
    .trim();
}
