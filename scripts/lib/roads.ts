// Road-owner lookup, computed offline by the seed (build-plan §5).
// Nearest MassDOT Road Inventory segment within 20 m: bbox prefilter, then
// point-to-segment distance on every part (LineString and MultiLineString).
// Distance uses a local equirectangular projection (metres), which is exact
// enough at 20 m and ~100x faster than turf's geodesic pointToLineDistance.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROADS_PATH = join(process.cwd(), "data", "boston-roads.geojson");
export const NEAREST_MAX_METERS = 20;

type Pos = [number, number];
interface RoadFeature {
  properties: { Jurisdictn?: string | number; St_Name?: string; OBJECTID?: number };
  geometry: { type: "LineString"; coordinates: Pos[] } | { type: "MultiLineString"; coordinates: Pos[][] } | null;
}
interface IndexedRoad {
  props: RoadFeature["properties"];
  parts: Pos[][];
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface OwnerResult {
  jurisdictionCode: string;
  roadSegmentId: string;
  roadName: string;
}

let index: IndexedRoad[] | undefined;

function buildIndex(): IndexedRoad[] {
  const fc = JSON.parse(readFileSync(ROADS_PATH, "utf8")) as { features: RoadFeature[] };
  const items: IndexedRoad[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    const raw = g?.type === "MultiLineString" ? g.coordinates : g?.type === "LineString" ? [g.coordinates] : [];
    const parts = raw.filter((p) => p.length >= 2);
    if (parts.length === 0) continue;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const part of parts)
      for (const [x, y] of part) {
        if (x < minLon) minLon = x;
        if (x > maxLon) maxLon = x;
        if (y < minLat) minLat = y;
        if (y > maxLat) maxLat = y;
      }
    items.push({ props: f.properties ?? {}, parts, minLon, minLat, maxLon, maxLat });
  }
  return items;
}

/** Metres from (lat, lon) to the polyline, projecting around the point. */
function partDistance(part: Pos[], lat: number, lon: number, kx: number): number {
  let best = Infinity;
  for (let i = 1; i < part.length; i++) {
    const ax = (part[i - 1][0] - lon) * kx, ay = (part[i - 1][1] - lat) * 111_320;
    const bx = (part[i][0] - lon) * kx, by = (part[i][1] - lat) * 111_320;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best) best = d;
  }
  return best;
}

export function nearestOwner(lat: number, lon: number): OwnerResult | undefined {
  index ??= buildIndex();
  const dLat = NEAREST_MAX_METERS / 111_320;
  const dLon = NEAREST_MAX_METERS / (111_320 * Math.cos((lat * Math.PI) / 180));
  const kx = 111_320 * Math.cos((lat * Math.PI) / 180);
  let best: { dist: number; r: IndexedRoad } | undefined;
  for (const r of index) {
    if (r.maxLon < lon - dLon || r.minLon > lon + dLon || r.maxLat < lat - dLat || r.minLat > lat + dLat) continue;
    for (const part of r.parts) {
      const dist = partDistance(part, lat, lon, kx);
      if (dist <= NEAREST_MAX_METERS && (!best || dist < best.dist)) best = { dist, r };
    }
  }
  if (!best) return undefined;
  return {
    jurisdictionCode: String(best.r.props.Jurisdictn ?? ""),
    roadSegmentId: String(best.r.props.OBJECTID ?? ""),
    roadName: String(best.r.props.St_Name ?? ""),
  };
}
