import type { Repo } from "@/core/types";
import { PostgresRepo } from "@/db/repo";
import { fixtureRepo } from "@/workflow/fixtureRepo";

// Postgres when DATABASE_URL is set, else the in-memory fixture repo.
let cached: PostgresRepo | undefined;

export function getRepo(): Repo {
  const url = process.env.DATABASE_URL;
  if (typeof url === "string" && url.length > 0) return (cached ??= new PostgresRepo());
  return fixtureRepo;
}
