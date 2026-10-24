// Applies db/schema.sql to the configured database and prints the tables and
// indexes. Run: `npx tsx --env-file=.env.local scripts/apply-schema.ts`.
// The seed does the same drop-and-create as its first step; this script is a
// standalone way to apply and inspect the schema (Requirement 2.4).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeSql } from "./lib/db.ts";

async function main(): Promise<void> {
  const sql = makeSql();
  const ddl = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  await sql.unsafe(ddl);

  const tables = await sql<{ table_name: string }[]>`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  const idx = await sql<{ indexname: string }[]>`
    select indexname from pg_indexes
    where schemaname = 'public' order by indexname`;

  console.log("tables :", tables.map((t) => t.table_name).join(", "));
  console.log("indexes:", idx.map((i) => i.indexname).join(", "));
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
