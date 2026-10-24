// Road-owner lookup, computed offline (dispatch-ledger §5 / build-plan §5).
//
// The seed downloads Boston's MassDOT Road Inventory segments once to
// data/boston-roads.geojson, then finds the nearest segment within 20 m of each
// problem (bounding-box prefilter, then @turf/turf) to set jurisdictionCode and
// roadSegmentId. The deployed app never calls this; it reads the stored values.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lineString, point, pointToLineDistance } from "@turf/turf";

const ROAD_INVENTORY_URL =
  "https://services1.arcgis.com/ceiitspzDAHrdGO1/ArcGIS/rest/services/17c_support/FeatureServer/0/query";
const ROADS_PATH = join(process.cwd(), "data", "boston-roads.geojson");
const PAGE = 1000;
export const NEAREST_MAX_METERS = 20;

interface RoadFeature {
  type: "Feature";
  properties: { Jurisdictn?: string; St_Name?: string; OBJECTID?: number };
  geometry:
    | { type: "LineString"; coordinates: [number, number][] }
    | { type: "MultiLineString"; coordinates: [number, number][][] };
}
interface RoadCollection {
  type: "FeatureCollection";
  features: RoadFeature[];
}

export interface OwnerResult {
  jurisdictionCode: string;
  roadSegmentId: string;
}

/** Download all Boston segments (City=35) as GeoJSON, paged. Throws on failure. */
async function downloadRoads(): Promise<RoadCollection> {
  const features: RoadFeature[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url =
      `${ROAD_INVENTORY_URL}?where=${encodeURIComponent("City=35")}` +
      `&outFields=${encodeURIComponent("Jurisdictn,St_Name,OBJECTID")}` +
      `&outSR=4326&resultOffset=${offset}&resultRecordCount=${PAGE}&f=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Road Inventory HTTP ${res.status}`);
    const page = (await res.json()) as RoadCollection & {
      exceededTransferLimit?: boolean;
    };
    const batch = page.features ?? [];
    features.push(...batch);
    if (batch.length < PAGE) break;
  }
  if (features.length === 0) throw new Error("Road Inventory returned 0 features");
  return { type: "FeatureCollection", features };
}

let cache: RoadCollection | undefined;

/**
 * Ensure data/boston-roads.geojson exists (downloading once if missing) and
 * return the loaded segments. Throws if the download is needed but fails — the
 * seed catches that and uses the fallback candidates file.
 */
export async function ensureRoads(): Promise<RoadCollection> {
  if (cache) return cache;
  if (!existsSync(ROADS_PATH)) {
    const roads = await downloadRoads();
    writeFileSync(ROADS_PATH, JSON.stringify(roads));
    cache = roads;
    return roads;
  }
  cache = JSON.parse(readFileSync(ROADS_PATH, "utf8")) as RoadCollection;
  return cache;
}

/** Degrees of latitude per metre; longitude scaled by cos(lat). Rough, fine for 20 m. */
function bbox(lat: number, lon: number, meters: number): [number, number, number, number] {
  const dLat = meters / 111_320;
  const dLon = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}

/** A segment's line parts and its bounding box over every vertex, built once. */
interface IndexedRoad {
  f: RoadFeature;
  parts: [number, number][][];
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

let index: { roads: RoadCollection; items: IndexedRoad[] } | undefined;

function indexFor(roads: RoadCollection): IndexedRoad[] {
  if (index?.roads === roads) return index.items;
  const items: IndexedRoad[] = [];
  for (const f of roads.features) {
    const g = f.geometry;
    const parts = (
      g?.type === "MultiLineString" ? g.coordinates : g?.type === "LineString" ? [g.coordinates] : []
    ).filter((part) => part.length >= 2);
    if (parts.length === 0) continue;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const part of parts) {
      for (const [x, y] of part) {
        if (x < minLon) minLon = x;
        if (x > maxLon) maxLon = x;
        if (y < minLat) minLat = y;
        if (y > maxLat) maxLat = y;
      }
    }
    items.push({ f, parts, minLon, minLat, maxLon, maxLat });
  }
  index = { roads, items };
  return items;
}

/**
 * Nearest road segment within 20 m of (lat, lon). Prefilter on each segment's
 * full bounding box (all vertices, all parts), then exact point-to-line distance
 * via turf on every part. Returns undefined if none within 20 m.
 */
export function nearestOwner(
  lat: number,
  lon: number,
  roads: RoadCollection,
): OwnerResult | undefined {
  const pt = point([lon, lat]);
  const box = bbox(lat, lon, NEAREST_MAX_METERS); // [minLon, minLat, maxLon, maxLat]
  let best: { dist: number; f: RoadFeature } | undefined;

  for (const r of indexFor(roads)) {
    if (r.maxLon < box[0] || r.minLon > box[2] || r.maxLat < box[1] || r.minLat > box[3]) continue;
    for (const part of r.parts) {
      const dist = pointToLineDistance(pt, lineString(part), { units: "meters" });
      if (dist <= NEAREST_MAX_METERS && (!best || dist < best.dist)) {
        best = { dist, f: r.f };
      }
    }
  }

  if (!best) return undefined;
  return {
    jurisdictionCode: String(best.f.properties.Jurisdictn ?? ""),
    roadSegmentId: String(best.f.properties.OBJECTID ?? ""),
  };
}

// --- Fallback: the 150 pre-checked candidates -----------------------------

interface CandidateRow {
  id: string;
  lat: number;
  lon: number;
  segments?: [string, string][]; // [street name, jurisdiction code]
}
interface CandidateFile {
  all_checked?: CandidateRow[];
  state_owned_or_mixed?: CandidateRow[];
}

const FALLBACK_PATH = join(
  process.cwd(),
  "research",
  "open311",
  "jurisdiction-checked-candidates.json",
);

let fallbackCache: Map<string, OwnerResult> | undefined;

/**
 * Build an id → owner map from research/open311/jurisdiction-checked-candidates.json
 * for when the Road Inventory download is unavailable. The code is taken from the
 * report's first (on-location) segment; the segment id is the street name.
 */
export function loadFallbackOwners(): Map<string, OwnerResult> {
  if (fallbackCache) return fallbackCache;
  const raw = JSON.parse(readFileSync(FALLBACK_PATH, "utf8")) as CandidateFile;
  const rows = raw.all_checked ?? raw.state_owned_or_mixed ?? [];
  const map = new Map<string, OwnerResult>();
  for (const r of rows) {
    const seg = r.segments?.[0];
    if (!seg) continue;
    map.set(r.id, { jurisdictionCode: String(seg[1]), roadSegmentId: seg[0] });
  }
  fallbackCache = map;
  return map;
}
