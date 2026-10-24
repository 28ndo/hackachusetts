import { fmtDay } from "./format";

export function Sparkline({ data }: { data: { day: string; count: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 600;
  const h = 56;
  const bw = w / data.length;
  const first = data[0];
  const last = data[data.length - 1];
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" role="img" aria-label={`Reports per day, ${fmtDay(first.day)} to ${fmtDay(last.day)}, peak ${max}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const bh = Math.max(1, (d.count / max) * (h - 2));
          return (
            <rect key={d.day} x={i * bw + 1} y={h - bh} width={Math.max(1, bw - 2)} height={bh} rx={1} className="fill-accent/70">
              <title>{`${fmtDay(d.day)}: ${d.count} reports`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{fmtDay(first.day)}</span>
        <span>Reports per day (peak {max.toLocaleString("en-US")})</span>
        <span>{fmtDay(last.day)}</span>
      </figcaption>
    </figure>
  );
}
