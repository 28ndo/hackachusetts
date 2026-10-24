// Loads and validates data/entities.yaml and data/service-families.yaml (build-plan §4, §10).
// zod turns a bad hand-edit of the YAML into a clear error at load time.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { TRIAGE_ID, type Entity } from "@/core/types";

export const SERVICE_FAMILIES = ["streetlight", "pothole", "sidewalk", "tree", "signal", "sign", "wire"] as const;
export const NOT_ROUTED = "not routed";

const dataDir = join(process.cwd(), "data");

const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["city_dept", "state_agency", "utility", "other_town", "authority", "private"]),
  department: z.string().optional(),
  queues: z.array(z.string()),
  owns: z.array(z.string()),
  where: z.object({ jurisdictionCodes: z.array(z.string()).optional() }).optional(),
  hazard: z.record(z.string(), z.number()).optional(),
  need: z.array(z.string()).optional(),
  help: z.array(z.string()).optional(),
  cant: z
    .array(z.object({ rule: z.string(), check: z.string(), sendTo: z.array(z.string()).optional(), outcome: z.string().optional() }))
    .optional(),
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
    .object({ ontimePct: z.number().optional(), stillOpen: z.number().optional(), referredOnPct: z.number().optional() })
    .optional(),
  respondWithin: z.string().optional(),
  contact: z.string().optional(),
});

function loadYaml<T>(file: string, schema: z.ZodType<T>): T {
  const result = schema.safeParse(parseYaml(readFileSync(join(dataDir, file), "utf8")));
  if (!result.success) throw new Error(`data/${file} failed validation:\n${result.error.toString()}`);
  return result.data;
}

let entitiesCache: Entity[] | undefined;

/** The entity catalog from data/entities.yaml (validated, cached). */
export function loadEntities(): Entity[] {
  // cant[].outcome is a plain string in the YAML; the cast narrows it to OutcomeCode.
  entitiesCache ??= loadYaml("entities.yaml", z.array(entitySchema)) as unknown as Entity[];
  return entitiesCache;
}

export function entityById(id: string): Entity | undefined {
  return loadEntities().find((e) => e.id === id);
}

/** Display name; "Ops triage" for the triage pseudo-entity, the id itself when unknown. */
export function entityName(id: string): string {
  if (id === TRIAGE_ID) return "Ops triage";
  return entityById(id)?.name ?? id;
}

let familyIndex: Map<string, string> | undefined;
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** Open311 service_name → family, case/whitespace-insensitive; NOT_ROUTED otherwise. */
export function familyOf(serviceName: string): string {
  if (!familyIndex) {
    const { families } = loadYaml(
      "service-families.yaml",
      z.object({ families: z.record(z.string(), z.array(z.string()).nullable()) }),
    );
    familyIndex = new Map();
    for (const [family, names] of Object.entries(families)) {
      for (const name of names ?? []) familyIndex.set(norm(name), family);
    }
  }
  return familyIndex.get(norm(serviceName ?? "")) ?? NOT_ROUTED;
}

/** "48h" → 48, "4h" → 4; 48 when missing or unparseable. */
export function respondWithinHours(entity: Entity | undefined): number {
  const m = entity?.respondWithin?.match(/^\s*(\d+(?:\.\d+)?)\s*h\s*$/i);
  return m ? Number(m[1]) : 48;
}

function span(days: number): string {
  if (days < 60) {
    const n = Math.round(days);
    return `${n} ${n === 1 ? "day" : "days"}`;
  }
  return `${Math.round(days / 30)} months`;
}

/** Honest ETA from 2024 workload, e.g. "Usually done in 10 days; 9 in 10 within 6 months". */
export function etaLine(entity: Entity | undefined): string | undefined {
  const median = entity?.workload?.medianDays;
  if (median === undefined) return undefined;
  const first = `Usually done ${median < 1 ? "within a day" : `in ${span(median)}`}`;
  const p90 = entity?.workload?.p90Days;
  if (p90 === undefined) return first;
  return `${first}; 9 in 10 ${p90 < 1 ? "within a day" : `within ${span(p90)}`}`;
}

const FAMILY_LABELS: Record<string, string> = {
  streetlight: "Streetlight",
  pothole: "Pothole",
  sidewalk: "Sidewalk",
  tree: "Street tree",
  signal: "Traffic signal",
  sign: "Sign",
  wire: "Wire / pole",
};

export function familyLabel(family: string): string {
  return FAMILY_LABELS[family] ?? family;
}
