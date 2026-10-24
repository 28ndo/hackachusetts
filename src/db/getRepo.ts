import type { Repo } from "@/core/types";
import { PostgresRepo } from "@/db/repo";
import { fixtureRepo } from "@/workflow/fixtureRepo";

// Returns PostgresRepo when DATABASE_URL is set (deployed / seeded), and the
// in-memory fixtureRepo otherwise (local dev without a database). The app and
// its server actions call getRepo() rather than choosing a backend directly.

let cached: Repo | undefined;

export function getRepo(): Repo {
  if (cached) return cached;
  cached = process.env.DATABASE_URL ? new PostgresRepo() : fixtureRepo;
  return cached;
}
