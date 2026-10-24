# Tasks: dispatch-ledger

MVP only, in this order. Each task ends green (typecheck + its tests) before the next.

- [x] 1. Data foundations
  - Create `data/service-families.yaml` mapping Open311 `service_name` → family
    (`streetlight`, `pothole`, `sidewalk`, `tree`, `signal`, `sign`, `wire`); anything else
    is "not routed" but still counted.
  - Append entity `btd-signals` to `data/entities.yaml` with the values in Requirement 1.3.
  - In `src/core/fixtures.ts`, move the traffic-signal problems to `btd-signals`; keep
    `pwd-highway-d07` as the citywide pothole/street-cleaning owner.
  - Add `loadEntities()` and `familyOf()` (`src/core/entities.ts`) with zod validation.
  - _Requirements: 1.1–1.6_

- [x] 2. Schema on Neon
  - Write `db/schema.sql`: `reports`, `problems`, `problem_reports`, `assignments`,
    `outcomes`, `routing_overrides`, `replay_queue`; no `entities` table; indexes on
    `assignments(entity_id, state)` and `problems(service_family, road_segment_id)`;
    drop-and-create safe.
  - Apply and inspect it on Neon (Neon power when connected, else the `postgres` client).
  - _Requirements: 2.1–2.5_

- [x] 3. Clustering
  - Implement `cluster()` and `addReport()` in `src/ledger/cluster.ts` per §3 (same family;
    within 25 m or same road segment; within 14 days of last report; problem not resolved).
    A re-report raises `reporterCount` and refreshes `lastReportedAt`.
  - Property tests: one report → one problem; order-independent and idempotent; a re-report
    never closes a problem.
  - _Requirements: 3.1–3.5_

- [x] 4. Routing, priority and outcomes
  - Implement `route()` (learned override → jurisdiction → family → triage; never throws;
    human reason; `missing` from `need`), `priority()` (hazard × people × overdue, factor
    breakdown + "why"), and fill `OUTCOMES` for all 9 codes with next states and resident
    messages in `data/locales/en.json` and `data/locales/ht.json`.
  - Property tests: priority monotonic + bounded; override always wins; exactly one decision
    per problem; every code has next states and a message in both locales.
  - _Requirements: 4.1–4.8_

- [x] 5. Road owner, computed offline
  - Download Boston road segments once to `data/boston-roads.geojson` (MassDOT Road
    Inventory, `City=35`, `outSR=4326`, paged) and commit it.
  - Nearest segment within 20 m (bbox prefilter + `@turf/turf`) → set `jurisdictionCode`
    and `roadSegmentId`. Fall back to `jurisdiction-checked-candidates.json` on failure.
  - _Requirements: 5.1–5.4_

- [x] 6. Seed (`npm run seed`, also the demo reset)
  - Drop/recreate schema; insert every snapshot report for the counter; cluster + enrich
    routable reports; `route()` + `priority()` → one assignment per problem; hold back the
    newest Morrissey Blvd DCR report and the newest Metropolitan Ave & Poplar St report into
    `replay_queue`; print counts; under 2 min; rerunnable.
  - Set the npm script to `tsx --env-file=.env.local scripts/seed.ts`; use
    `DATABASE_URL_UNPOOLED` when set, else `DATABASE_URL`.
  - _Requirements: 6.1–6.7_

- [x] 7. PostgresRepo (announce the types.ts change)
  - Add `nextReplayReport()` to `Repo` in `src/core/types.ts` (announce + show the diff).
  - Implement every `Repo` method in `src/db/repo.ts` with the `postgres` client
    (`prepare: false`). Add `src/db/getRepo.ts` (Postgres when `DATABASE_URL` set, else
    `fixtureRepo`). Implement `nextReplayReport()` in `fixtureRepo` too.
  - Add one integration test, skipped when `DATABASE_URL` missing; load `.env.local` in
    `vitest.config.ts` via `loadEnv`.
  - _Requirements: 7.1–7.5_

- [x] 8. applyOutcome, per OUTCOMES
  - Implement `applyOutcome()`: record outcome, set next problem/assignment states.
    `NOT_OURS` closes the assignment as `rerouted`, creates attempt + 1 for `newOwnerId`,
    and stores a `RoutingOverride` keyed by `roadSegmentId` (or a ~50 m area key) + family.
  - Property test on `fixtureRepo`: after `NOT_OURS`, `route()` returns the new owner for
    that segment.
  - _Requirements: 8.1–8.3_

- [x] 9. Inbox UI
  - `/` overview (counter, entity cards, scorecard); `/inbox/[entityId]` with switcher,
    priority-ranked packets, "Why #1" + routing reason; packet detail (description;
    block-level address for sensitive types; photos; reporter count + factors; respondBy /
    resolveBy; need/help checklist with missing flagged); 9 outcome buttons as server
    actions with input forms; resident preview panel with en/ht switch; keep the demo banner.
  - _Requirements: 9.1–9.7_

- [x] 10. Replay
  - "Replay next report" button → `nextReplayReport()` → `ingestReport` (addReport → route →
    assignment); show where it landed and the confidence ("learned" after a `NOT_OURS`).
  - _Requirements: 10.1–10.2_

- [ ] 11. Ship
  - `npm run build` and `npm test` green; `DATABASE_URL` set on Vercel; seed production Neon;
    Playwright MCP clicks through scenes 2–4 on the live URL.
  - _Requirements: 11.1–11.4_
