// Loads and validates the YAML data files that back the ledger (build-plan §4, §10):
//   data/entities.yaml         → the entity catalog (no database table)
//   data/service-families.yaml → Open311 service_name → service family
//
// zod validation turns a malformed hand-edit of the YAML into a clear error at
// load time, instead of an undefined-field crash deep inside routing.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { Entity } from "@/core/types";

// The seven routable families (build-plan §10). Anything else is "not routed".
export const SERVICE_FAMILIES = [
  "streetlight",
  "pothole",
  "sidewalk",
  "tree",
  "signal",
  "sign",
  "wire",
] as const;

export type ServiceFamily = (typeof SERVICE_FAMILIES)[number];
export const NOT_ROUTED = "not routed";

// Resolve data files relative to the repo root (process.cwd() in Next.js and tsx).
const dataDir = join(process.cwd(), "data");

// --- entities.yaml ---------------------------------------------------------

const entityCantSchema = z.object({
  rule: z.string(),
  check: z.string(),
  sendTo: z.array(z.string()).optional(),
  outcome: z.string().optional(),
});

const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum([
    "city_dept",
    "state_agency",
    "utility",
    "other_town",
    "authority",
    "private",
  ]),
  department: z.string().optional(),
  queues: z.array(z.string()),
  owns: z.array(z.string()),
  where: z.object({ jurisdictionCodes: z.array(z.string()).optional() }).optional(),
  hazard: z.record(z.string(), z.number()).optional(),
  need: z.array(z.string()).optional(),
  help: z.array(z.string()).optional(),
  cant: z.array(entityCantSchema).optional(),
  workload: z
    .object({
      perDay: z.number().optional(),
      medianDays: z.number().optional(),
      p90Days: z.number().optional(),
      slaDays: z.number().optional(),
      ontimePct: z.number().optional(),
      open: z.number().optional(),
    })
    .optional(),
  handoffToday: z
    .object({
      ontimePct: z.number().optional(),
      stillOpen: z.number().optional(),
      referredOnPct: z.number().optional(),
    })
    .optional(),
  respondWithin: z.string().optional(),
  contact: z.string().optional(),
});

const entitiesSchema = z.array(entitySchema);

let entitiesCache: Entity[] | undefined;

/** Load and validate the entity catalog from data/entities.yaml (cached). */
export function loadEntities(): Entity[] {
  if (entitiesCache) return entitiesCache;
  const raw = readFileSync(join(dataDir, "entities.yaml"), "utf8");
  const parsed = parseYaml(raw);
  const result = entitiesSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `data/entities.yaml failed validation:\n${result.error.toString()}`,
    );
  }
  // The zod shape mirrors Entity in types.ts; cast through unknown for the
  // branded OutcomeCode on cant[].outcome, which is a string at the data layer.
  entitiesCache = result.data as unknown as Entity[];
  return entitiesCache;
}

/** Look up a single entity by id, or undefined. */
export function entityById(id: string): Entity | undefined {
  return loadEntities().find((e) => e.id === id);
}

// --- service-families.yaml -------------------------------------------------

const serviceFamiliesSchema = z.object({
  families: z.record(z.string(), z.array(z.string())),
});

let familyIndexCache: Map<string, ServiceFamily> | undefined;

function familyIndex(): Map<string, ServiceFamily> {
  if (familyIndexCache) return familyIndexCache;
  const raw = readFileSync(join(dataDir, "service-families.yaml"), "utf8");
  const parsed = parseYaml(raw);
  const result = serviceFamiliesSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `data/service-families.yaml failed validation:\n${result.error.toString()}`,
    );
  }
  const index = new Map<string, ServiceFamily>();
  for (const [family, names] of Object.entries(result.data.families)) {
    if (!(SERVICE_FAMILIES as readonly string[]).includes(family)) {
      throw new Error(
        `service-families.yaml: "${family}" is not a known family (${SERVICE_FAMILIES.join(", ")})`,
      );
    }
    for (const name of names) index.set(normalize(name), family as ServiceFamily);
  }
  familyIndexCache = index;
  return index;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Map an Open311 service_name to a routable family, or "not routed" when it
 * belongs to no family. Case- and whitespace-insensitive.
 */
export function familyOf(serviceName: string): ServiceFamily | typeof NOT_ROUTED {
  if (!serviceName) return NOT_ROUTED;
  return familyIndex().get(normalize(serviceName)) ?? NOT_ROUTED;
}

/** Reset the in-memory caches (used by tests that patch the data files). */
export function resetEntityCaches(): void {
  entitiesCache = undefined;
  familyIndexCache = undefined;
}
