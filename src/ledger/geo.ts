// Small geo helpers for clustering (build-plan §3). Distances are tiny (25–150 m),
// so haversine is accurate enough and needs no projection.

const EARTH_RADIUS_M = 6_371_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(bLat - aLat) / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(toRad(bLon - aLon) / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Absolute difference between two ISO timestamps, in days. */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.abs(Date.parse(aIso) - Date.parse(bIso)) / DAY_MS;
}
