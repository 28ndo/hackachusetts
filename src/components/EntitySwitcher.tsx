"use client";

import { useRouter } from "next/navigation";

// "View as" entity switcher for the inbox (build-plan §2, §9). Navigating on
// change keeps the inbox a server component.

interface Props {
  current: string;
  entities: { id: string; name: string }[];
}

export function EntitySwitcher({ current, entities }: Props) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">View as</span>
      <select
        value={current}
        onChange={(e) => router.push(`/inbox/${e.target.value}`)}
        className="rounded border border-neutral-400 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900"
      >
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </label>
  );
}
