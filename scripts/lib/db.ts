import postgres from "postgres";

// Scripts prefer the unpooled URL (no PgBouncer) for bulk work.
export function makeSql(): postgres.Sql {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL(_UNPOOLED) is not set");
  return postgres(url, { prepare: false, onnotice: () => {} });
}
