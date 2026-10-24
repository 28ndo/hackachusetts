import type { ReactNode } from "react";

export function Banner({ tone, children }: { tone: "good" | "bad" | "accent"; children: ReactNode }) {
  const cls =
    tone === "good" ? "border-good/40 bg-good-soft" : tone === "bad" ? "border-bad/40 bg-bad-soft text-bad" : "border-accent/40 bg-accent-soft";
  return (
    <div role="status" className={`mb-4 rounded-lg border px-4 py-3 ${cls}`}>
      {children}
    </div>
  );
}
