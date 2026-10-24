# Kiro Quick Spec: `dispatch-ledger` (solo build on Postgres/Neon)

One spec replaces the three lane specs (C, D, F in PLAYBOOK §9). Niklas drives all code.

## Before you paste (5 minutes)

1. **Database URL.** Vercel → project → Storage → Neon → connect it to the project, so `DATABASE_URL` is set for Production. Then copy the connection string into a local `.env.local` at the repo root (it's gitignored). The fastest way: on Vercel's Neon storage page, open the **`.env.local`** tab, click **Copy Snippet**, and paste it into the file. That gets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in one go. (`npx vercel link` followed by `npx vercel env pull .env.local` also works, but needs a browser login.)
2. **Neon power.** Kiro → Powers → install **Neon** (this covers the Powers row of the write-up).
3. **Global steering.** `~/.kiro/steering/my-lane.md` is already rewritten for solo; Kiro may now edit every folder.

## How to run it

- Kiro → **Specs → + → Quick Spec**, name `dispatch-ledger`.
- Attach `#File research/build-plan.md`, `#File research/open311/README.md`, `#File data/entities.yaml` and `#File src/core/types.ts`, then paste the prompt below.
- Read `tasks.md` before running. Delete anything the prompt didn't ask for.
- **Two agents in parallel (optional, faster).** Task 1 must run first. After it:
  - **Kiro IDE** runs the logic and UI path: 3 → 4 → 8 → 9 → 10, against `fixtureRepo`.
  - **`kiro-cli --v3`** in a second terminal runs the database path: 2 → 5 → 6 → 7, with the prompt: "Implement tasks 2, 5, 6 and 7 of `.kiro/specs/dispatch-ledger/tasks.md`. Only touch `db/**`, `scripts/**`, `src/db/**` and `data/boston-roads.geojson`. Don't edit `tasks.md`."
  - The folders don't overlap. `getRepo()` (task 7) flips the UI from `fixtureRepo` to Postgres once `DATABASE_URL` is set. Log the two-agent setup in the Kiro log, since it's a strong write-up point.
- Use Autopilot. Review the diff after each task, and restore a checkpoint if a task goes sideways.
- Commit and push after every green task, because Vercel redeploys `main`.

## Prompt to paste

> Build the demo path from build-plan §9 as one spec, backed by Postgres on Neon. I'm the only developer now, so ignore the three-lane folder ownership in older docs. Follow `src/core/types.ts`; if you change it, say so at the top of your response and show the diff. MVP only: at most 12 tasks, in this order. **Done** means the deployed Vercel app runs scenes 2–4 of §9 on real data read from Postgres.
>
> 1. **Data foundations.**
>    - `data/service-families.yaml` maps Open311 `service_name` to a family: `streetlight`, `pothole`, `sidewalk`, `tree`, `signal`, `sign`, `wire`. Anything else maps to "not routed" but is still counted.
>    - Add entity `btd-signals` to `data/entities.yaml`, with these values:
>      - name: Boston Transportation Department, Traffic Signals and Signs;
>      - kind: `city_dept`; department: `BTDT`; owns `signal` and `sign`;
>      - queues: `BTDT_Traffic Signal_Repair`;
>      - hazard: signal 4, sign 2;
>      - need: "Intersection", "Which light is out, and which street it faces";
>      - help: "Fully dark, flashing, or stuck on one color";
>      - workload: `{ perDay: 8.2, medianDays: 0.12, p90Days: 1.6, slaDays: 1, ontimePct: 89.4, open: 0 }`;
>      - respondWithin: 4h.
>
>      (These come from `research/department-map.json`, which Kiro is set to ignore.)
>    - In `src/core/fixtures.ts`, the traffic-signal problems belong to `btd-signals`, not `pwd-highway-d07`. Fix that.
>    - Treat `pwd-highway-d07` as the citywide pothole and street-cleaning owner for this demo.
>    - Add `loadEntities()` and `familyOf()` with zod validation.
> 2. **Schema.**
>    - `db/schema.sql` tables: `reports`, `problems`, `problem_reports`, `assignments`, `outcomes`, `routing_overrides`, `replay_queue`.
>    - Entities stay in YAML; no entities table.
>    - Index `assignments(entity_id, state)` and `problems(service_family, road_segment_id)`.
>    - Use the Neon power to apply and inspect the schema.
> 3. **Clustering.**
>    - `cluster()` and `addReport()` per §3: same family; within 25 m or on the same road segment; within 14 days of the problem's last report; the problem is not resolved.
>    - A re-report on an open problem raises `reporterCount` and refreshes `lastReportedAt`.
>    - Property-based tests (fast-check):
>      - every report belongs to exactly one problem;
>      - clustering is order-independent and idempotent;
>      - a re-report never closes a problem.
> 4. **Routing, priority and outcomes.**
>    - `route()` per §5, in order:
>      1. learned override;
>      2. `jurisdictionCode` (1 MassDOT, 3 DCR, 0 or H private, giving the `PRIVATE_PROPERTY` path);
>      3. family via `entity.owns`;
>      4. triage.
>
>      It never throws, gives a human-readable `reason`, and fills `missing` from the entity's `need`.
>    - `priority()` = hazard × people × overdue (people = 1 + log2(reporterCount × gap)), returning the factor breakdown and a "why" line, e.g. "7 people waiting · 9 days overdue · hazard 2".
>    - `OUTCOMES`: the 9 codes map to the next problem status, the next assignment state, and a grade-8 resident message in English and Haitian Creole (`data/locales/en.json`, `data/locales/ht.json`).
>    - Property-based tests:
>      - priority is monotonic in reporters, hazard and overdue, and bounded;
>      - an override always wins;
>      - every problem gets exactly one decision;
>      - every code has next states and a message in both locales.
> 5. **Road owner, computed offline.**
>    - Download Boston road segments once to `data/boston-roads.geojson` and commit it. Source: the MassDOT Road Inventory layer in `research/311-brief.md` §5, with `where=City=35`, `outSR=4326`, paged.
>    - For each problem, find the nearest segment within 20 m (bounding-box prefilter, then `@turf/turf`). Set `jurisdictionCode` and `roadSegmentId`.
>    - If the download fails, fall back to `research/open311/jurisdiction-checked-candidates.json`.
>    - No external calls at request time.
> 6. **Seed: `npm run seed` is also the demo reset.**
>    - Drop and recreate the schema.
>    - Load `research/open311/boston-open311-2026-09-24_to_2026-10-24.json` and insert every report, for the counter.
>    - Cluster and enrich the routable reports.
>    - Run `route()` and `priority()` to create one assignment per problem.
>    - Hold back into `replay_queue` the newest report on the Morrissey Blvd DCR segment, and the newest at Metropolitan Ave & Poplar St.
>    - Print the counts. It must run in under 2 minutes and be safe to rerun.
>    - `tsx` doesn't read `.env.local` (only Next.js does), so the npm script must be `tsx --env-file=.env.local scripts/seed.ts`. Use `DATABASE_URL_UNPOOLED` for the seed when it's set, and `DATABASE_URL` otherwise.
> 7. **PostgresRepo.**
>    - Implement every `Repo` method in `src/db/repo.ts` with the `postgres` client.
>    - Add `nextReplayReport()` to `Repo`. This is a `types.ts` change, so announce it.
>    - `src/db/getRepo.ts` returns `PostgresRepo` when `DATABASE_URL` is set, and `fixtureRepo` otherwise.
>    - Add one integration test, skipped when `DATABASE_URL` is missing. Vitest doesn't load `.env.local` into `process.env` either, so load it in `vitest.config.ts` with Vite's `loadEnv`.
>    - Create the `postgres` client with `prepare: false`, because Neon's pooled URL runs through PgBouncer.
> 8. **`applyOutcome`, per `OUTCOMES`.**
>    - `NOT_OURS` closes the assignment as `rerouted` and creates attempt + 1 for `newOwnerId`.
>    - It also stores a `RoutingOverride` keyed by `roadSegmentId` (or a ~50 m area key) plus the family.
>    - Property-based test on `fixtureRepo`: after `NOT_OURS`, `route()` returns the new owner for that segment.
> 9. **Inbox UI.**
>    - `/` overview:
>      - "20,730 reports → N problems → M routed";
>      - entity cards with open counts;
>      - the scorecard from §7.
>    - `/inbox/[entityId]`, with an entity switcher: assignments ranked by priority, with the "Why #1" line and the routing reason.
>    - Packet detail shows:
>      - the description;
>      - the address, at block level for sensitive types;
>      - photos, linking the city's URLs;
>      - the reporter count and priority factors;
>      - `respondBy` and `resolveBy`;
>      - the need/help checklist, with missing items flagged.
>    - The 9 outcome buttons use server actions. Codes that need input open a small form (date, owner picker, note).
>    - A resident preview panel shows the message reporters will receive, with an en/ht switch.
>    - Keep the demo-mode banner.
> 10. **Replay.** A "Replay next report" button calls `nextReplayReport()`, then `ingestReport` (addReport → route → assignment). Show where the report landed and its confidence ("learned" after a `NOT_OURS`).
> 11. **Ship.**
>     - `npm run build` and `npm test` are green.
>     - `DATABASE_URL` is set on Vercel.
>     - Seed the production Neon database.
>     - Use the Playwright MCP to click through scenes 2–4 on the live URL.
>
> **Not in scope:** map, resident status page, more languages, stale escalation, "closure didn't hold", auth, intake UI, and any call to a real 311 or agency endpoint.

## Cut lines if you fall behind

| Check | If it's missed |
|---|---|
| **17:15**: Neon seeded, and `/inbox/dcr` renders from Postgres on the live URL | Drop task 5 and use the cached 150 jurisdiction checks only |
| **17:45**: outcome buttons, `NOT_OURS` reroute and replay work on the live URL | Drop the Haitian Creole locale and the scorecard; keep the overview counter |
| **18:15**: feature freeze | Bugfixes on the demo path only |
