// Shared Postgres client factory for scripts and the app (dispatch-ledger).
// Uses DATABASE_URL_UNPOOLED when present (direct connection, best for the seed),
// else DATABASE_URL (Neon's pooled URL through PgBouncer). prepare:false is
// required because PgBouncer in transaction mode can't use prepared statements.

import postgres from "postgres";

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "No database URL. Set DATABASE_URL (or DATABASE_URL_UNPOOLED) in .env.local.",
    );
  }
  return url;
}

export function makeSql(url: string = databaseUrl()) {
  return postgres(url, { prepare: false });
}
