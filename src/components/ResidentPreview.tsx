"use client";

import { useState } from "react";

// The resident preview panel (build-plan §5b): shows the plain-language message
// reporters will receive, with an English / Haitian Creole switch. Messages are
// precomputed on the server (locale files are read there) and passed in.

interface Props {
  messages: { en: string; ht: string };
  labels: { en: string; ht: string };
}

export function ResidentPreview({ messages, labels }: Props) {
  const [locale, setLocale] = useState<"en" | "ht">("en");

  return (
    <section
      aria-labelledby="resident-preview-heading"
      className="rounded-lg border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id="resident-preview-heading" className="text-sm font-semibold">
          What the reporter will see
        </h3>
        <div
          role="group"
          aria-label="Preview language"
          className="flex overflow-hidden rounded-md border border-neutral-400 text-xs dark:border-neutral-600"
        >
          {(["en", "ht"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              aria-pressed={locale === loc}
              onClick={() => setLocale(loc)}
              className={`px-2.5 py-1 font-medium ${
                locale === loc
                  ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                  : "bg-transparent"
              }`}
            >
              {labels[loc]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-neutral-800 dark:text-neutral-200" lang={locale}>
        {messages[locale]}
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        Machine-drafted, pending city language review.
      </p>
    </section>
  );
}
