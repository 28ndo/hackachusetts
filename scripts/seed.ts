// Offline seed pipeline: normalize → enrich (road owner, block group; cached)
// → cluster → route() + priority() → Postgres. Rebuilds the DB in under 2 min.
// OWNER: P2 (problem-ledger spec). Placeholder; invoked by `npm run seed`.
// No external API calls at request time: all lookups are cached here.

async function main(): Promise<void> {
  // TODO (P2): implement the seed pipeline against Neon Postgres.
  console.log("seed: not implemented yet (placeholder)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
