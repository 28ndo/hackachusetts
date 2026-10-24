"use client";

import { useRouter } from "next/navigation";

export function EntitySwitcher({ current, options }: { current: string; options: { id: string; name: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      View as
      <select
        value={current}
        onChange={(e) => router.push(`/inbox/${e.target.value}`)}
        className="min-h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}
