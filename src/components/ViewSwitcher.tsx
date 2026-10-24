"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The three ways to look at one ledger, plus the home page that explains them.
const VIEWS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/ledger", label: "Ledger", match: (p: string) => p.startsWith("/ledger") },
  { href: "/inbox/dcr", label: "Entity", match: (p: string) => p.startsWith("/inbox") || p.startsWith("/packet") },
  { href: "/resident", label: "Resident", match: (p: string) => p.startsWith("/resident") },
];

export function ViewSwitcher() {
  const path = usePathname() ?? "/";
  return (
    <nav aria-label="Views" className="flex items-center gap-1 rounded-md border border-line bg-surface-2 p-0.5">
      {VIEWS.map((v) => {
        const active = v.match(path);
        return (
          <Link
            key={v.href}
            href={v.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-8 rounded px-3 py-1 text-sm font-medium ${
              active ? "bg-accent text-white dark:text-black" : "text-muted hover:text-ink"
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
