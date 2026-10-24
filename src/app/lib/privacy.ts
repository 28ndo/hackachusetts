// Privacy helpers for public views (hackathon guardrails, open311 README):
// sensitive service families are shown at block level, never a precise address.

const SENSITIVE_FAMILIES = new Set(["housing", "encampment", "needle", "animal"]);

export function isSensitive(serviceFamily: string): boolean {
  return SENSITIVE_FAMILIES.has(serviceFamily);
}

/**
 * Coarsen an address to the block for sensitive types: drop a leading house
 * number so "14 Quincy St" becomes "Quincy St (block level)". Intersection
 * addresses are already coarse and pass through.
 */
export function displayAddress(address: string, serviceFamily: string): string {
  if (!isSensitive(serviceFamily)) return address;
  const stripped = address.replace(/^\s*\d+\s+/, "");
  return `${stripped} (block level)`;
}
