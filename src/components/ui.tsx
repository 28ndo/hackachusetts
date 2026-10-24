import type { ReactNode } from "react";
import type { EntityKind, RoutingConfidence } from "@/core/types";

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/30",
  good: "bg-good-soft text-good border-good/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  bad: "bg-bad-soft text-bad border-bad/30",
};

export function Chip({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const KIND_LABEL: Record<EntityKind, string> = {
  city_dept: "city dept",
  state_agency: "state agency",
  utility: "utility",
  other_town: "other town",
  authority: "authority",
  private: "private",
};

export function KindBadge({ kind }: { kind?: EntityKind | "triage" }) {
  if (!kind) return null;
  if (kind === "triage") return <Chip tone="warn">ops triage</Chip>;
  const tone: Tone = kind === "state_agency" ? "accent" : kind === "utility" ? "warn" : "neutral";
  return <Chip tone={tone}>{KIND_LABEL[kind]}</Chip>;
}

export function ConfidenceChip({ confidence }: { confidence: RoutingConfidence }) {
  const tone: Tone =
    confidence === "learned" ? "good" : confidence === "jurisdiction" ? "accent" : confidence === "triage" ? "warn" : "neutral";
  return (
    <Chip tone={tone} title="How the router chose this owner">
      {confidence === "learned" ? "✓ learned rule" : confidence}
    </Chip>
  );
}

export function Section({ title, kicker, children, id }: { title: ReactNode; kicker?: ReactNode; children: ReactNode; id?: string }) {
  const hid = id ? `${id}-h` : undefined;
  return (
    <section aria-labelledby={hid} className="mt-10">
      <h2 id={hid} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {kicker && <p className="mt-0.5 text-sm text-muted">{kicker}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>;
}
