const TZ = "America/New_York";

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function valid(iso?: string): Date | undefined {
  if (!iso) return undefined;
  // Date-only strings are calendar days: anchor at noon UTC so NY time keeps the same day.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** "Oct 24" */
export function fmtDay(iso?: string): string {
  const d = valid(iso);
  return d ? dayFmt.format(d) : "—";
}

/** "Oct 24, 18:48" */
export function fmtTime(iso?: string): string {
  const d = valid(iso);
  return d ? timeFmt.format(d) : "—";
}

export function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function num(n: number): string {
  return n.toLocaleString("en-US");
}
