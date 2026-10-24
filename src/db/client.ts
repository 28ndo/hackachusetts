import postgres from "postgres";

// A single postgres client for the app. prepare:false is required because Neon's
// pooled URL (DATABASE_URL) runs through PgBouncer in transaction mode, which
// can't reuse prepared statements. The unpooled URL is for the seed only.

let client: ReturnType<typeof postgres> | undefined;

export function getSql(): ReturnType<typeof postgres> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = postgres(url, { prepare: false });
  return client;
}
