# Requirements: dispatch-ledger

## Introduction

The dispatch-ledger is the demo path from `research/build-plan.md` §9 (scenes 2–4),
built as one spec, backed by Postgres on Neon. It turns raw Boston Open311 reports
into problems, routes each problem to its real owner with a work packet, lets the
owner record a structured outcome, and learns from reroutes.

**Done** means the deployed Vercel app runs scenes 2–4 of §9 on real data read from
Postgres:

- Scene 2 (firehose → problems): a counter "20,730 reports → N problems → M routed",
  and a streetlight problem opened with its reports.
- Scene 3 (routing + work packet): a Morrissey Blvd problem routed to DCR by the
  MassDOT Road Inventory jurisdiction code, shown with its full packet and "why #1".
- Scene 4 (entity outcomes): DCR taps `NOT_OURS → MassDOT`, the problem reroutes and
  the rule is learned; a replayed report on that segment then goes straight to MassDOT.
  A streetlight problem taps `FIXED`; a resident preview shows the message in English
  and Haitian Creole. A problem taps `DEFERRED_CAPITAL` and the resident sees a target
  quarter, not "Noted".

This file follows `src/core/types.ts` as the shared contract. One change to that file
is required (adding `nextReplayReport` to `Repo`) and is called out in Requirement 7.

**Out of scope:** map, resident status page, more than two languages, stale escalation,
"closure didn't hold", auth, intake UI, and any call to a real 311 or agency endpoint.

---

## Requirement 1: Data foundations

**User story:** As the ledger, I want every Open311 `service_name` mapped to a service
family and the entity catalog complete, so routing and counting are deterministic.

#### Acceptance Criteria

1. WHEN `data/service-families.yaml` is loaded THEN it SHALL map Open311 `service_name`
   values to one of: `streetlight`, `pothole`, `sidewalk`, `tree`, `signal`, `sign`, `wire`.
2. WHEN a `service_name` matches no family THEN `familyOf()` SHALL return `"not routed"`,
   and the report SHALL still be counted in the totals.
3. WHEN `data/entities.yaml` is loaded THEN it SHALL include entity `btd-signals` with:
   name "Boston Transportation Department, Traffic Signals and Signs"; kind `city_dept`;
   department `BTDT`; owns `signal` and `sign`; queues `["BTDT_Traffic Signal_Repair"]`;
   hazard `{ signal: 4, sign: 2 }`; need `["Intersection", "Which light is out, and which
   street it faces"]`; help `["Fully dark, flashing, or stuck on one color"]`; workload
   `{ perDay: 8.2, medianDays: 0.12, p90Days: 1.6, slaDays: 1, ontimePct: 89.4, open: 0 }`;
   respondWithin `4h`.
4. WHEN fixtures define traffic-signal problems THEN those problems SHALL belong to
   `btd-signals`, not `pwd-highway-d07`.
5. WHEN a pothole or street-cleaning problem is routed for this demo THEN `pwd-highway-d07`
   SHALL be treated as the citywide owner regardless of district.
6. WHEN entity or family data is loaded THEN `loadEntities()` and `familyOf()` SHALL
   validate the data with zod and throw a clear error on malformed input.

## Requirement 2: Schema on Neon

**User story:** As the seed and the app, I want a Postgres schema on Neon, so reports,
problems, assignments, outcomes, overrides and the replay queue persist.

#### Acceptance Criteria

1. WHEN `db/schema.sql` is applied THEN it SHALL create tables `reports`, `problems`,
   `problem_reports`, `assignments`, `outcomes`, `routing_overrides`, `replay_queue`.
2. The schema SHALL NOT contain an `entities` table; entities stay in YAML.
3. The schema SHALL index `assignments(entity_id, state)` and
   `problems(service_family, road_segment_id)`.
4. WHEN applying or inspecting the schema THEN the Neon power SHALL be used where
   available; otherwise the `postgres` client against `DATABASE_URL` is used.
5. The schema SHALL be safe to drop and recreate (used as the demo reset).

## Requirement 3: Clustering

**User story:** As the ledger, I want reports collapsed into problems, so many reports
become one problem with one owner.

#### Acceptance Criteria

1. WHEN `cluster()` runs on a batch of reports THEN it SHALL group reports that share a
   service family AND are within 25 m or on the same road segment AND were reported within
   14 days of the problem's last report AND whose problem is not resolved.
2. WHEN `addReport()` adds a re-report to an open problem THEN it SHALL raise
   `reporterCount` and refresh `lastReportedAt`, and SHALL NOT close the problem.
3. (Property) Every report SHALL belong to exactly one problem.
4. (Property) Clustering SHALL be order-independent and idempotent.
5. (Property) A re-report SHALL never close a problem.

## Requirement 4: Routing, priority and outcomes

**User story:** As a dispatcher, I want each problem routed to its real owner with an
explainable reason, a priority, and a structured outcome protocol.

#### Acceptance Criteria

1. WHEN `route()` runs THEN it SHALL try, in order: (1) a learned override for the
   family + segment/area; (2) `jurisdictionCode` (1 → MassDOT, 3 → DCR, 0 or H → private
   via the `PRIVATE_PROPERTY` path); (3) family via `entity.owns`; (4) triage.
2. `route()` SHALL never throw, SHALL return a human-readable `reason`, and SHALL fill
   `missing` from the entity's `need` list.
3. WHEN `priority()` runs THEN it SHALL compute hazard × people × overdue, where
   people = 1 + log2(reporterCount × gap), and SHALL return the factor breakdown and a
   "why" line, e.g. "7 people waiting · 9 days overdue · hazard 2".
4. WHEN an outcome code is applied THEN `OUTCOMES` SHALL map all 9 codes to a next
   problem status, a next assignment state, and a grade-8 resident message available in
   English (`data/locales/en.json`) and Haitian Creole (`data/locales/ht.json`).
5. (Property) Priority SHALL be monotonic in reporters, hazard and overdue, and bounded.
6. (Property) An override SHALL always win over jurisdiction and family routing.
7. (Property) Every problem SHALL get exactly one routing decision.
8. (Property) Every outcome code SHALL have next states and a message in both locales,
   with the same placeholders.

## Requirement 5: Road owner, computed offline

**User story:** As the seed, I want each problem's road owner computed once from cached
data, so the app never calls an external API at request time.

#### Acceptance Criteria

1. WHEN road data is prepared THEN Boston road segments SHALL be downloaded once to
   `data/boston-roads.geojson` (MassDOT Road Inventory, `where=City=35`, `outSR=4326`,
   paged) and committed.
2. WHEN a problem is enriched THEN the nearest segment within 20 m SHALL be found with a
   bounding-box prefilter then `@turf/turf`, and `jurisdictionCode` and `roadSegmentId`
   SHALL be set.
3. IF the download fails THEN the seed SHALL fall back to
   `research/open311/jurisdiction-checked-candidates.json`.
4. The deployed app SHALL make no external calls at request time.

## Requirement 6: Seed and demo reset

**User story:** As the operator, I want `npm run seed` to rebuild the database and prime
the demo, repeatably and fast.

#### Acceptance Criteria

1. WHEN `npm run seed` runs THEN it SHALL drop and recreate the schema.
2. It SHALL load `research/open311/boston-open311-2026-09-24_to_2026-10-24.json` and insert
   every report (for the counter).
3. It SHALL cluster and enrich the routable reports.
4. It SHALL run `route()` and `priority()` to create one assignment per problem.
5. It SHALL hold back into `replay_queue` the newest report on the Morrissey Blvd DCR
   segment AND the newest at Metropolitan Ave & Poplar St.
6. It SHALL print the counts, run in under 2 minutes, and be safe to rerun.
7. The npm script SHALL be `tsx --env-file=.env.local scripts/seed.ts`, and SHALL use
   `DATABASE_URL_UNPOOLED` when set, otherwise `DATABASE_URL`.

## Requirement 7: PostgresRepo (types.ts change)

**User story:** As the app, I want a Postgres-backed Repo, selected automatically when a
database is configured.

#### Acceptance Criteria

1. WHEN `PostgresRepo` is used THEN every `Repo` method SHALL be implemented with the
   `postgres` client.
2. `Repo` SHALL gain a `nextReplayReport()` method. **This is a change to
   `src/core/types.ts` and MUST be announced in the response with the diff.**
3. WHEN `getRepo()` runs THEN it SHALL return `PostgresRepo` when `DATABASE_URL` is set,
   and `fixtureRepo` otherwise.
4. There SHALL be one integration test, skipped when `DATABASE_URL` is missing;
   `vitest.config.ts` SHALL load `.env.local` via Vite's `loadEnv`.
5. The `postgres` client SHALL be created with `prepare: false` (Neon's pooled URL runs
   through PgBouncer).

## Requirement 8: applyOutcome, per OUTCOMES

**User story:** As a dispatcher, I want tapping an outcome to move the problem and, for a
reroute, learn the new owner.

#### Acceptance Criteria

1. WHEN any outcome code is applied THEN `applyOutcome()` SHALL record the outcome and set
   the next problem status and assignment state from `OUTCOMES`, and SHALL return a
   `StateChange` carrying the resident message.
2. WHEN `NOT_OURS` is applied THEN it SHALL close the current assignment as `rerouted`,
   create a new assignment (attempt + 1) for `newOwnerId`, AND store a `RoutingOverride`
   keyed by `roadSegmentId` (or a ~50 m area key) plus the family.
3. (Property) On `fixtureRepo`, after `NOT_OURS`, `route()` SHALL return the new owner for
   that segment.

## Requirement 9: Inbox UI

**User story:** As a dispatcher or ops steward, I want an overview and a per-entity inbox
with work packets and outcome actions.

#### Acceptance Criteria

1. The `/` overview SHALL show "20,730 reports → N problems → M routed", entity cards with
   open counts, and the scorecard from §7.
2. `/inbox/[entityId]` SHALL have an entity switcher and list assignments ranked by
   priority, each with a "Why #1" line and the routing reason.
3. A packet detail SHALL show: the description; the address (block level for sensitive
   types); photos linking the city's URLs; reporter count and priority factors; `respondBy`
   and `resolveBy`; and the need/help checklist with missing items flagged.
4. The 9 outcome buttons SHALL use server actions; codes that need input SHALL open a small
   form (date, owner picker, note).
5. A resident preview panel SHALL show the message reporters will receive, with an en/ht
   switch.
6. The demo-mode banner SHALL remain.
7. The UI SHALL meet the project's accessibility steering (WCAG 2.2 AA, plain language).

## Requirement 10: Replay

**User story:** As a presenter, I want a "Replay next report" button that proves the
learned routing.

#### Acceptance Criteria

1. WHEN "Replay next report" is clicked THEN it SHALL call `nextReplayReport()`, then
   `ingestReport` (addReport → route → assignment).
2. It SHALL show where the report landed and its confidence, showing "learned" after a
   `NOT_OURS` on that segment.

## Requirement 11: Ship

**User story:** As the operator, I want the demo live on Vercel against production Neon.

#### Acceptance Criteria

1. `npm run build` and `npm test` SHALL be green.
2. `DATABASE_URL` SHALL be set on Vercel.
3. The production Neon database SHALL be seeded.
4. The Playwright MCP SHALL be used to click through scenes 2–4 on the live URL.
