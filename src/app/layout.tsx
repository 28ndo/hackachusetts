import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { loadEntities } from "@/core/entities";
import { TRIAGE_ID } from "@/core/types";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dispatch Ledger",
  description: "Every report becomes one problem, with one owner and one honest outcome.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const entities = loadEntities();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-sm">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 bg-surface px-2 py-1 rounded">
          Skip to content
        </a>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-base">
              <span aria-hidden className="inline-block h-5 w-5 rounded bg-accent" />
              Dispatch Ledger
            </Link>
            <ViewSwitcher />
            <nav aria-label="Main" className="flex items-center gap-4 text-muted">
              <details className="relative">
                <summary className="cursor-pointer list-none hover:text-ink">Inboxes ▾</summary>
                <ul className="absolute left-0 z-[1000] mt-2 w-64 rounded-md border border-line bg-surface p-1 shadow-lg">
                  {entities.map((e) => (
                    <li key={e.id}>
                      <Link href={`/inbox/${e.id}`} className="block rounded px-2 py-1.5 text-ink hover:bg-surface-2">
                        {e.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/inbox/${TRIAGE_ID}`} className="block rounded px-2 py-1.5 text-ink hover:bg-surface-2">
                      Ops triage
                    </Link>
                  </li>
                </ul>
              </details>
            </nav>
            <span className="ml-auto rounded-full border border-warn/40 bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-warn">
              Demo mode · no real 311 cases are filed
            </span>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
          Data: Boston Open311, Sep 24 – Oct 24, 2026 · MassDOT Road Inventory · 2024 workload figures are the legacy-system baseline.
        </footer>
      </body>
    </html>
  );
}
