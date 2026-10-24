// Small geo helpers for clustering (dispatch-ledger §3). Thresholds are tiny
// (20–25 m), so the haversine great-circle distance is accurate enough and needs
// no projection. @turf/turf is reserved for the seed's nearest-segment query.

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance between two lat/lon points, in metres. */
export function haversineMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Absolute difference between two ISO timestamps, in days. */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.abs(Date.parse(aIso) - Date.parse(bIso)) / DAY_MS;
}
