import postgres from "postgres";

// One postgres client for the app. prepare:false because Neon's pooled URL runs
// through PgBouncer in transaction mode, which can't reuse prepared statements.
// Every query is schema-qualified (v2.*); we never rely on search_path.

let client: postgres.Sql | undefined;

export function getSql(): postgres.Sql {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = postgres(url, { prepare: false });
  return client;
}
