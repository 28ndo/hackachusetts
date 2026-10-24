# Design: dispatch-ledger

## Overview

One offline seed pipeline builds a Postgres database on Neon; one Next.js app reads it.
The core logic (`cluster`, `addReport`, `route`, `priority`, `OUTCOMES`, `applyOutcome`)
is pure and tested with fast-check, and is shared by both the seed and the app. Nothing
in the request path calls an external API.

```
boston-open311 snapshot (20,730 real reports)
        │  npm run seed  (tsx --env-file=.env.local)  — offline, <2 min, rerunnable
        ▼
 normalize → familyOf → cluster → enrich (road owner from cached geojson)
          → route() + priority() → write reports/problems/assignments → stash replay_queue
        │
        ▼  Next.js app on Vercel, reads Postgres via getRepo()
 /  overview counter + entity cards + scorecard
 /inbox/[entityId]  ranked packets → 9 outcome server actions → applyOutcome()
                      NOT_OURS → new assignment + routing_overrides row
 "Replay next report" → nextReplayReport() → ingestReport (addReport→route→assignment)
```

## The types.ts change (announced)

`Repo` gains one method. This is the only change to the shared contract:

```ts
export interface Repo {
  // ...existing methods unchanged...
  ingestReport(report: Report): Promise<Problem>;
  /** Pop the next held-back report from replay_queue, or undefined when empty. */
  nextReplayReport(): Promise<Report | undefined>;
}
```

Both `fixtureRepo` and `PostgresRepo` implement it. The task that touches `types.ts`
(Task 8) reprints this diff at the top of its response.

## Data foundations (Req 1)

- `data/service-families.yaml`: a map from `service_name` → family. Shape:
  `families: { streetlight: [service_name, ...], pothole: [...], ... }`. `familyOf(name)`
  lower-cases and trims, looks the name up, and returns the family or `"not routed"`.
- `src/core/entities.ts`: `loadEntities()` reads `data/entities.yaml`, parses with a zod
  schema mirroring `Entity` in `types.ts`, and caches the result. `familyOf()` lives
  alongside, loading `service-families.yaml` with its own zod schema.
- `btd-signals` is appended to `entities.yaml`. Traffic-signal fixtures move to
  `btd-signals`. `pwd-highway-d07`'s `owns` already covers pothole and street_cleaning;
  for this demo its district is ignored (it is the only pothole owner matched by family).

Zod note: zod validation turns a malformed YAML edit into a clear thrown error at load
time rather than an undefined-field crash deep in routing.

## Schema (Req 2)

`db/schema.sql`, idempotent (`drop ... cascade` then `create`):

- `reports(id text pk, source, service_name, service_family, description, lat, lon,
  address, media_url, requested_at timestamptz, preferred_language, problem_id)`
- `problems(id text pk, service_family, lat, lon, road_segment_id, neighborhood,
  block_group_id, ej_criteria, limited_english_pct, reporter_count, first_reported_at,
  last_reported_at, status, jurisdiction_code, priority jsonb)`
- `problem_reports(problem_id, report_id)` — the cluster membership join table.
- `assignments(id text pk, problem_id, entity_id, attempt, sent_at, respond_by,
  resolve_by, routing_reason, confidence, state)`
- `outcomes(id text pk, assignment_id, code, note, photo_url, scheduled_for, by_who, at)`
- `routing_overrides(id serial pk, service_family, road_segment_id, area_key, entity_id,
  learned_from, created_at)`
- `replay_queue(id serial pk, payload jsonb, label text, created_at)` — held-back reports.

Indexes: `assignments(entity_id, state)`, `problems(service_family, road_segment_id)`.
No `entities` table. Applied via the Neon power when connected, else the `postgres` client.

## Clustering (Req 3)

`cluster(reports)`:
- Sort reports by `requestedAt` (so "within 14 days of last report" is well-defined and
  the result is order-independent after the sort).
- For each report, in time order, find an existing open problem of the same family within
  25 m (haversine) or the same `roadSegmentId`, whose `lastReportedAt` is within 14 days.
  If found, attach (reporterCount++, refresh lastReportedAt). Else start a new problem.
- Idempotency: re-running on reports that already carry a `problemId` reproduces the same
  grouping because membership is derived from distance/time, not insertion order.

`addReport(report, nearbyOpen)`: the single-report version used at runtime. Same predicate;
returns the joined problem (mutated: reporterCount, lastReportedAt, reportIds) or a new one.
Never flips status toward closed.

Distance: a small haversine helper in `src/ledger/geo.ts` (25 m, 20 m thresholds are tiny,
so haversine is accurate enough; turf is reserved for the segment nearest-point in the seed).

## Routing, priority, outcomes (Req 4)

`route(problem, { entities, overrides })`, first match wins, each returns a `reason`:
1. **Learned override**: an override matching family + (roadSegmentId or areaKey) →
   confidence `learned`, reason "Learned: rerouted this segment to {name}".
2. **Jurisdiction**: `jurisdictionCode` 1 → MassDOT, 3 → DCR, confidence `jurisdiction`.
   Codes 0 or H → the private path: entityId stays triage-like but the decision names the
   `PRIVATE_PROPERTY` outcome in its reason (no city entity owns it).
3. **Family**: first entity whose `owns` includes the family → confidence `rule`.
4. **Triage**: entityId `"triage"`, confidence `triage`, reason "No owner; sent to ops".

`missing` = entity.need items not satisfiable from the problem/report (for the demo we flag
the full `need` list minus what the packet can show, kept simple: items with no data).

`priority(problem, entity, now)`:
- `hazard` = `entity.hazard[family]` (fallback per family constant).
- `gap` = 1 (BARI weighting is pitch-only, §5); kept in the signature and breakdown.
- `people` = 1 + log2(max(reporterCount, 1) × gap).
- `overdue` = 1 + min(hoursPastTarget / targetHours, 2), capped at 3; target from
  `respondWithin`/workload; 1 when not overdue.
- `score` = hazard × people × overdue. `why` joins the human parts with " · ".
- Monotonic and bounded by construction (log2 grows, overdue capped at 3, hazard 1–5).

`OUTCOMES` (`src/core/outcomes.ts`): fill all 9 codes with next states (already stubbed
correctly) and real `residentMessage(outcome)` that reads from a locale bundle. Messages
live in `data/locales/en.json` and `data/locales/ht.json`, keyed by code, with `{date}`,
`{owner}` placeholders. `residentMessage` interpolates from the `Outcome` and the active
locale. A helper `residentMessageFor(code, outcome, locale)` powers the en/ht preview.

## Road owner offline (Req 5)

`scripts/lib/roads.ts`:
- `ensureRoads()` downloads the MassDOT Road Inventory for Boston (`where=City=35`,
  `outSR=4326`, paged by `resultOffset`) to `data/boston-roads.geojson` if absent, then
  loads it. On any network failure it logs and signals fallback.
- `nearestOwner(lat, lon, roads)`: bounding-box prefilter (~25 m lat/lon degrees) then
  `turf.nearestPointOnLine` / `pointToLineDistance` over candidates; within 20 m returns
  `{ jurisdictionCode, roadSegmentId }`.
- Fallback: `research/open311/jurisdiction-checked-candidates.json` is matched by report id
  to recover `jurisdictionCode` for the demo segments when the geojson is unavailable.

The seed is the only place roads are read; the app stores the computed codes in `problems`.

## Seed (Req 6)

`scripts/seed.ts` (run with `tsx --env-file=.env.local`):
1. Connect with `postgres(URL, { prepare: false })`, URL = `DATABASE_URL_UNPOOLED ?? DATABASE_URL`.
2. Run `db/schema.sql` (drop + create).
3. Stream-parse the 21 MB snapshot; normalize each record to `Report`, compute
   `service_family`; insert all into `reports` (batched) for the counter.
4. Take routable reports (family ≠ "not routed"), `cluster()` them, enrich each problem
   with `nearestOwner`, then `route()` + `priority()` and create one assignment per problem.
5. Hold back into `replay_queue`: the newest report on the Morrissey Blvd DCR segment, and
   the newest at Metropolitan Ave & Poplar St (matched by address/segment).
6. Print counts (reports, problems, routed, held). Batched inserts keep it under 2 min;
   the drop-and-create makes it safe to rerun.

## PostgresRepo & getRepo (Req 7)

- `src/db/repo.ts`: `PostgresRepo` implements every `Repo` method with SQL. Row↔type
  mappers convert snake_case columns to the camelCase types. `priority` stored as jsonb.
- `nextReplayReport()`: `delete from replay_queue where id = (select min(id)...) returning payload`.
- `src/db/getRepo.ts`: `process.env.DATABASE_URL ? new PostgresRepo() : fixtureRepo`.
- `vitest.config.ts`: `loadEnv` merges `.env.local` into `process.env` so the integration
  test (skipped when `DATABASE_URL` missing) can connect.
- Client created once with `prepare: false`.

## applyOutcome (Req 8)

`applyOutcome(repo, assignmentId, outcome)`:
- Look up assignment + problem. Read `OUTCOMES[code]`. Record the outcome.
- Update problem status and assignment state to the mapped next values.
- `NOT_OURS`: set current assignment `rerouted`; create a new assignment for `newOwnerId`
  with `attempt + 1`; `addOverride({ serviceFamily, roadSegmentId (or ~50 m areaKey),
  entityId: newOwnerId, learnedFrom: outcome.id })`.
- Build `residentMessage` from `OUTCOMES[code].residentMessage(outcome)`.
- Return a `StateChange` with previous/next states, the message, and (for NOT_OURS) the
  new assignment id and learned override.
- Area key: `areaKeyFor(lat, lon)` rounds to ~50 m (3 decimal places ≈ 110 m is too coarse;
  use a 0.00045° grid ≈ 50 m) so a replayed nearby report matches the override.

## Inbox UI (Req 9, 10)

- `src/db/getRepo.ts` is the single data entry point for server components and actions.
- `/` (server component): counts from the repo; entity cards (open assignment counts);
  scorecard table. The "20,730" total comes from `count(*)` on `reports`.
- `/inbox/[entityId]`: server component lists assignments, computes `priority` for each,
  sorts desc, renders packets. An entity `<select>` switcher navigates between inboxes.
- Packet: a client-light server component. Sensitive service families (housing,
  encampment, needle, animal) render address at block level via a `blockLevel(address)`
  helper. Photos use `next/image` with the allowed Cloudinary host.
- Outcome buttons: a server action per submit. Codes needing input (`SCHEDULED`,
  `MADE_SAFE`, `DEFERRED_CAPITAL` → date; `NOT_OURS` → owner picker; `NOT_FOUND`,
  `NEEDS_INFO`, `DUPLICATE` → note) reveal a small inline `<form>`.
- Resident preview: shows `residentMessageFor(code, previewOutcome, locale)` with an
  en/ht toggle (two buttons, `aria-pressed`).
- Replay: a form posting to a server action that calls `repo.nextReplayReport()` then
  `repo.ingestReport()`, and renders the landing entity + confidence.
- Accessibility: semantic landmarks, labelled inputs, visible focus, 4.5:1 contrast,
  keyboard reachable, strings in locale files where resident-facing.

## Ship (Req 11)

- Commit `data/boston-roads.geojson`, locales, schema, code.
- `DATABASE_URL` set on Vercel (Neon storage integration).
- Seed production: `npm run seed` against the production URL.
- Playwright MCP walks scenes 2–4 on the live URL.

## Testing strategy

- `src/ledger/cluster.test.ts` — properties 3.3–3.5.
- `src/core/priority.test.ts` — properties 4.5 (monotonic, bounded).
- `src/core/routing/route.test.ts` — properties 4.6, 4.7 (override wins, one decision).
- `src/core/outcomes.test.ts` — property 4.8 (locale parity, placeholders).
- `src/workflow/applyOutcome.test.ts` — property 8.3 (NOT_OURS → route returns new owner).
- `src/db/repo.int.test.ts` — one integration test, `describe.skipIf(!DATABASE_URL)`.
- fast-check only, per `tech.md`.
