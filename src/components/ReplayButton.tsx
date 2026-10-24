"use client";

import { useState, useTransition } from "react";
import { replayNext, type ReplayResult } from "@/app/actions";

// "Replay next report" (build-plan §9 scene 4, §10): pops the next held-back
// report, ingests it (addReport → route → assignment), and shows where it landed
// and the routing confidence ("learned" once a NOT_OURS override covers it).

export function ReplayButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [empty, setEmpty] = useState(false);

  function onClick() {
    startTransition(async () => {
      const r = await replayNext();
      if (r) {
        setResult(r);
        setEmpty(false);
      } else {
        setResult(null);
        setEmpty(true);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="min-h-[36px] rounded-md bg-neutral-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {pending ? "Replaying…" : "Replay next report"}
      </button>

      {result && (
        <div
          role="status"
          className="rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p>
            <span className="font-medium">{result.address}</span> landed at{" "}
            <span className="font-medium">{result.landedEntityName}</span>.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            {result.reason} · confidence:{" "}
            <span
              className={
                result.confidence === "learned"
                  ? "font-semibold text-green-700 dark:text-green-400"
                  : ""
              }
            >
              {result.confidence}
            </span>
          </p>
        </div>
      )}
      {empty && (
        <p role="status" className="text-sm text-neutral-500">
          No more held-back reports. Run <code>npm run seed</code> to reset the demo.
        </p>
      )}
    </div>
  );
}
