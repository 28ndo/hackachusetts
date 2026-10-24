// One-time download of Boston's MassDOT Road Inventory segments to
// data/boston-roads.geojson (committed). Run:
//   npx tsx scripts/download-roads.ts
// The seed also calls ensureRoads(), which downloads on demand if the file is
// missing, so this script is just an explicit, reviewable way to refresh it.

import { statSync } from "node:fs";
import { join } from "node:path";
import { ensureRoads } from "./lib/roads.ts";

async function main(): Promise<void> {
  const roads = await ensureRoads();
  const path = join(process.cwd(), "data", "boston-roads.geojson");
  const sizeMb = (statSync(path).size / 1_000_000).toFixed(1);
  console.log(`roads: ${roads.features.length} segments, ${sizeMb} MB → ${path}`);
}

main().catch((err) => {
  console.error("download failed:", err.message);
  process.exit(1);
});
