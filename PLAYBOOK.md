# Team playbook: how the three of us build this today

Read this once (5 minutes). The plan is in [research/build-plan.md](research/build-plan.md); this file is how we execute it.

**The idea: contract first, then three parallel lanes.** The first 25 minutes produce one shared contract: types, interfaces, fixtures and the folder layout. After that, each person works on their own machine, in their own Kiro spec, in their own folders. Nobody waits for anybody; until a real piece lands, you build against fixtures and stubs.

---

## 1. Who does what

| | **Niklas: the app** | **P2: the ledger** (DB teammate) | **P3: the brain and the story** (mapping teammate) |
|---|---|---|---|
| Builds | Entity inbox, work packet, outcome buttons, reroute + learn, scorecard, ops view, resident status page, map; deploy and integration | Postgres schema, all SQL, snapshot ingest, enrichment (road owner, block group), clustering, seed script, hygiene queries | `data/entities.yaml`, `route()`, `priority()`, outcome-code table and resident messages. **From 17:00:** video, README, Kiro write-up |
| Kiro spec | `entity-workflow` | `problem-ledger` | `routing-and-priority` |
| Owns (only you edit these) | `src/app/**`, `src/components/**`, `src/workflow/**` | `db/**`, `scripts/**`, `src/ledger/**`, `src/db/**` | `data/**`, `src/core/routing/**`, `src/core/priority.ts`, `src/core/outcomes.ts`, `docs/**` |
| Kiro features you'll show | Specs; Autopilot for UI vs Supervised for logic; checkpoints; steering | Specs; **property-based tests** on clustering; **Neon power** | Specs; a **hook** that runs PBT on save; **OpenContext MCP**; optionally one **Kiro Web** task |

**Shared files with a single owner:**
- `src/core/types.ts` and `.kiro/steering/**`: Niklas. Say it in chat before changing them.
- `package.json`: announce in chat, `git pull`, install, then commit `package.json` and `package-lock.json` immediately.

---

## 2. How the pieces fit

```
research/open311/boston-open311-2026-09-24_to_2026-10-24.json   (20,730 real Boston reports, Sep 24 – Oct 24)
        │
        ▼  P2: npm run seed   (offline pipeline, rebuilds the DB in ~2 min)
   normalize → enrich (road owner from MassDOT layer, cached) → cluster → route() + priority() → Postgres
                                                                   ▲ P3's pure functions
        │
        ▼  Niklas: Next.js app on Vercel
   inbox / packet / outcome ──► applyOutcome() ──► NOT_OURS: route() again + RoutingOverride row
                                                   "replay next report" → addReport() → route() → lands with the new owner
```

**Rule:** all external lookups (MassDOT road owner, census block group) happen in the seed pipeline and are cached. The deployed app never calls an outside API.

**Interfaces.** These live in `src/core/types.ts`, written during setup; stubs exist from minute one:

```ts
// P2: src/ledger/cluster.ts
cluster(reports: Report[]): Problem[]                                  // batch, for the seed
addReport(report: Report, nearbyOpen: Problem[]): Problem              // runtime, for the replay button

// P3: src/core/routing/route.ts, src/core/priority.ts, src/core/outcomes.ts
route(problem: Problem, ctx: { entities: Entity[]; overrides: RoutingOverride[] }): RoutingDecision
// RoutingDecision = { entityId, queue?, reason, confidence: "learned"|"jurisdiction"|"rule"|"triage", missing: string[] }
priority(problem: Problem, entity: Entity, now: Date): Priority      // { score, hazard, people, overdue, gap, why }
OUTCOMES: Record<OutcomeCode, { nextProblemStatus; nextAssignmentState; needs?; residentMessage(o): string }>

// Niklas: src/workflow/applyOutcome.ts
applyOutcome(repo: Repo, assignmentId: string, outcome: Outcome): Promise<StateChange>

// P2: src/db/repo.ts implements Repo. Niklas uses fixtureRepo until it lands.
interface Repo { listInbox; getProblem; recordOutcome; createAssignment; updateAssignment;
                 updateProblem; addOverride; listOverrides; scorecard; ingestReport }
```

---

## 3. Stack (decided; change it only if P2 has already started on something else)

- Next.js (App Router) with TypeScript strict, and Tailwind
- Postgres on **Neon** (create it from Vercel → Storage → Neon, so `DATABASE_URL` is set for you), using the `postgres` client
- **Vercel** auto-deploys every push to `main`. A failed build doesn't replace the live site.
- Vitest and **fast-check** for tests; `tsx` for scripts; Leaflet for the map

---

## 4. Setup, 15:20–15:45 (all three in parallel)

**Everyone, first (5 min):**
1. Install the **Kiro IDE** from kiro.dev/downloads and sign in.
2. Clone the repo:
   ```bash
   git clone https://github.com/28ndo/hackachusetts.git && cd hackachusetts
   ```
3. Set **your own** name. The Kiro log uses it. Run this inside the repo:
   ```bash
   git config user.name "<Your Name>"
   ```
4. Create your **personal lane file** at `~/.kiro/steering/my-lane.md`. Global steering lives only on your machine, so each person's Kiro stays in their own folders:
   ```markdown
   ---
   inclusion: always
   ---
   I am <name>, the <app | ledger | brain> owner on a 3-person team.
   Only create or edit files in: <your folders from the table in PLAYBOOK.md section 1>.
   If a task needs a change elsewhere, stop and tell me what to ask the owner for.
   ```
5. Open the folder in Kiro. Check three panels: **Steering** (you see `hackathon-guardrails`), **Agent Hooks** (block-secrets, log-spec-task), and **MCP servers** (context7 and playwright connect).

**Niklas (driver):**
1. Commit and push the research. The `.gitignore` keeps out `resources/` (the thesis PDF isn't ours to publish), the organizers' files, and `IDEAS.md`.
2. In Kiro chat, paste **Prompt A** (steering), review the result, then paste **Prompt B** (scaffold).
3. Run `npm test` and `npm run dev` until both work, then commit and push.
4. Vercel: import the GitHub repo, then Storage → Create → Neon. Send `DATABASE_URL` to the team **in a DM, never in the repo**.
5. Post "scaffold pushed" in the team chat.

**P2, while waiting:**
1. Kiro → Powers panel → find and install the **Neon** power, and log it.
2. Read `research/open311/README.md` (record shape, demo scenes, privacy rules) and skim the snapshot JSON.

**P3, while waiting:**
1. Paste **Prompt E** into Kiro chat. It creates `data/entities.yaml`.
2. Draft plain-language resident messages for the 9 outcome codes (build-plan §6).

**Everyone, after "scaffold pushed" (about 15:45):**
```bash
git pull
cp .env.example .env
npm install
npm test
npm run dev
```
In `.env`, paste the `DATABASE_URL` Niklas sent you.

Then in Kiro: **Specs → +** and paste your spec prompt (C, D or F).

---

## 5. Your working loop in Kiro (every person, all afternoon)

1. **Spec (10–15 min, don't gold-plate).** Kiro writes `requirements.md`. Cut it to the MVP before approving, then `design.md`, then `tasks.md` (keep it at 10 tasks or fewer). Attach the plan with `#` → File → `research/build-plan.md`.
2. **Run one task at a time** at first, so you can review. Use **Supervised** mode for logic (you accept each change) and **Autopilot** for UI.
3. **After every finished task**, with tests green:
   ```bash
   git add <your folders>
   git commit -m "<what>"
   git pull --rebase
   git push
   ```
4. **Is the agent going in circles?** Restore a **checkpoint** instead of arguing with it. That's also a write-up point.
5. **Log Kiro moments as they happen.** Type `#log-kiro-usage` in Kiro chat; it writes to your own file in `docs/kiro-log/`. Finished spec tasks are logged there automatically.

---

## 6. Git rules (first shared repo)

- **Everyone commits to `main`; no branches today.** Separate folders make that safe.
- **Stage paths, not everything:** use `git add src/ledger db scripts`, never `git add .`. That keeps out `.env` and other people's half-done files.
- **Push at least every 30 minutes.** Small pushes mean small conflicts.
- **Always `git pull --rebase` before `git push`.**
- **If you get a conflict:** don't force-push and don't delete anything. Run `git status` and call Niklas.
- **If `package.json` conflicts:** keep both sides' dependencies, run `npm install`, and commit the lockfile.
- **Never commit `.env`.** The block-secrets hook also stops Kiro from writing keys into files.

---

## 7. Sync points (2 minutes each: done, next, blocked?)

| Time | What |
|---|---|
| **15:45** | Scaffold pulled, everyone in their spec |
| **16:30** | Unblock check. P2: are real problems in the DB? P3: do `route()` and `priority()` pass PBT? Niklas: does the inbox work on fixtures? |
| **17:00** | **Integration checkpoint.** The demo path (build-plan §9) runs on real data in the deployed app, ugly is fine. If not, cut Should items. **P3 switches to the story.** |
| **18:15** | **Feature freeze.** Only demo-path bugfixes after this. |
| 18:15–19:15 | Record the video (P3 drives, Niklas operates the app) and upload it **publicly** |
| 19:15–19:45 | P3 compiles `docs/kiro-log/*` into `KIRO_LOG.md`; README; submission form |
| **19:45** | **Submit** |

---

## 8. Kiro coverage (every row needs an owner and a log entry)

| Feature | Owner | How we show it |
|---|---|---|
| Surfaces | all | **IDE for everyone.** CLI is already covered by Niklas's logged headless hook test (14:56). Optional: P3 runs one Kiro Web task (Prompt G) around 17:00 if there's slack. Crew: skip. |
| Specs | all | Three specs. Compare one task done spec-first with one vibe-coded (Niklas, UI polish). |
| Hooks | P3 | The existing block-secrets and log hooks, plus a new one: on save of `src/core/**` run `npx vitest run src/core`. Break a property on purpose and screenshot the catch. |
| Steering | Niklas | product, tech and structure, plus **personal lane files** (global steering) that keep three agents out of each other's folders. That's the strategy story. |
| MCP | P3 | context7 and playwright (existing), plus the City of Boston **OpenContext** server (CKAN). Use it once for real, e.g. checking SLA targets from the live dataset. |
| Property-based tests | P2, P3 | Clustering invariants (P2); priority, routing and outcome invariants (P3). Screenshot a shrunk counterexample. |
| Powers | P2 | The Neon power for the database |

**Check once:** after your first spec task finishes, confirm a row appears in `docs/kiro-log/trail-<you>.md`. If it doesn't, the hook's `PostTaskExec` trigger name is wrong. Recreate the hook through Kiro's hook UI ("+ → Ask Kiro to create a hook") and commit the JSON.

---

## 9. Prompts to paste into Kiro

**A. Steering (Niklas, Kiro chat).** Attach `research/build-plan.md` and `PLAYBOOK.md`.
> Create three steering files in `.kiro/steering/`, each with `inclusion: always` front matter.
> - `product.md`: positioning (§1), users (§2), the rule "no free-text-only closure, every outcome code maps to a next step and a resident message" (§6), and the demo storyboard (§9) as the definition of done. Keep it under 60 lines.
> - `tech.md`: the stack from PLAYBOOK §3, the commands `npm run dev`, `npm test` and `npm run seed`, the rule "no external API calls at request time; the seed pipeline caches all lookups", and "property-based tests use fast-check".
> - `structure.md`: the folder layout and the ownership table from PLAYBOOK §1, the interfaces from PLAYBOOK §2, and "never edit `src/core/types.ts` without saying so explicitly in your response".

**B. Scaffold (Niklas: Default agent, Autopilot on, a new chat session after A; review `src/core/types.ts` before committing).**
> Scaffold the project per tech.md and structure.md, in the repo root. Don't build features.
> 1. A Next.js App Router app (TypeScript strict, Tailwind, `src/` dir). Install up front: `postgres yaml zod leaflet react-leaflet @types/leaflet vitest fast-check tsx @turf/turf`.
> 2. `src/core/types.ts`: every type from build-plan §3 exactly, `OutcomeCode` from §6, `Entity` per the §4 entry format, plus `Priority`, `RoutingDecision`, `StateChange`, and the `Repo` interface from PLAYBOOK §2.
> 3. Stubs with signatures and TODO bodies:
>    - `src/ledger/cluster.ts`
>    - `src/core/routing/route.ts`: a working stub that routes by `entity.owns` with confidence `"rule"`
>    - `src/core/priority.ts`: a stub with score = reporterCount
>    - `src/core/outcomes.ts`
>    - `src/workflow/applyOutcome.ts`
>    - `src/db/repo.ts`
> 4. `src/workflow/fixtureRepo.ts`: an in-memory `Repo` seeded from `src/core/fixtures.ts`. Build 8 demo problems from the real records in `research/open311/demo-picks.json` (the scenes are described in `research/open311/README.md`). Include the Morrissey Blvd streetlight (DCR), the Gallivan Blvd streetlight (MassDOT), the 9-report traffic signal at Metropolitan Ave & Poplar St, the 8-report pothole cluster at 14 Quincy St, and a mix of open and overdue.
> 5. `db/schema.sql` (empty placeholder), `scripts/seed.ts` (placeholder), `.env.example` with `DATABASE_URL=`, npm scripts `dev`, `build`, `test` and `seed`, and one passing Vitest smoke test that imports fast-check.
> 6. A "Demo mode: no real 311 cases are filed" banner in the root layout.
> 7. The repo root isn't empty, so `create-next-app` will refuse to run there. Scaffold into a temporary folder and move the files in. Never overwrite `README.md`, `KIRO_LOG.md`, `PLAYBOOK.md`, `.kiro/`, `.kiroignore`, `.vscode/` or `research/`. Merge Next's `.gitignore` entries into ours, and never ignore `.kiro/`.

**C. Spec `entity-workflow` (Niklas).**
> New spec. Source of truth: build-plan §2, §6, §7, §9, §10. Build only the demo path (§9). MVP, at most 10 tasks. Use the `Repo` interface; develop against `fixtureRepo` and switch to the Postgres repo when it lands.
> - Entity inbox `/inbox/[entityId]` with an entity switcher, listing open assignments ranked by priority, with the "Why #1" line and a map.
> - Work packet detail: what, where, photos, reporter count, priority factors, respondBy and resolveBy, and the need/help checklist with missing items flagged.
> - One-tap outcome buttons for the 9 codes. Codes that need input open a small form (date, owner picker, note, photo URL).
> - `applyOutcome` implements the §6 next steps. `NOT_OURS` closes the current assignment as rerouted, creates an assignment for the chosen entity, and stores a `RoutingOverride`.
> - A "Replay next report" button on the ops view calls `repo.ingestReport` with a held-back real report on the same segment. It must land with the new owner with confidence "learned".
> - Ops view `/ops`: totals, the triage queue, stale assignments, and the entity scorecard (§7). Then (Should) resident status `/p/[problemId]` showing the plain-language message.
> - Property-based tests: every outcome code yields a defined next state and resident message; after `NOT_OURS`, `route()` returns the new owner for that segment.

**D. Spec `problem-ledger` (P2).**
> New spec. Sources: build-plan §3, §5 and §7; data in `research/open311/boston-open311-2026-09-24_to_2026-10-24.json` (20,730 real Boston reports; record shape and privacy rules in `research/open311/README.md`). MVP, at most 10 tasks. Only touch `db/**`, `scripts/**`, `src/ledger/**` and `src/db/**`.
> - `db/schema.sql` with these tables, indexed for inbox queries:
>   - `reports`, `problems`, `problem_reports`, `assignments`
>   - `outcomes`, `routing_overrides`, `entities`
> - Load and normalize the reports, with `service_name` mapped to `serviceFamily` via a small table. Skip rows with no lat/long.
> - **Road owner, offline:** download all Boston road segments once (MassDOT Road Inventory, `City=35`, with geometry, `outSR=4326`, paged) to `data/boston-roads.geojson`. Then use `@turf/turf` to find the nearest segment within 20 m, setting `jurisdictionCode` and `roadSegmentId`. The layer URL is in `research/311-brief.md` §5.
> - `cluster()` and `addReport()` per the §3 rule.
> - Property-based tests: every report belongs to exactly one problem; clustering is order-independent and idempotent; a re-report never closes a problem.
> - Initial assignments by calling `route()` and `priority()` from `src/core` (stubs until P3 lands).
> - `src/db/repo.ts` implements `Repo` against Postgres, including `ingestReport` (`addReport` → `route` → create the assignment).
> - Hygiene queries: stale assignments, closure didn't hold, orphans.
> - `npm run seed` rebuilds everything from scratch in under 2 minutes.
> - **Stretch:** a reporting-gap value for the top 50 problems by priority plus the demo problems, using the census geocoder and the BARI custodianship file (§5).

**E. Entities (P3, Kiro chat).**
> Read `research/department-map.json` and `research/build-plan.md` §4. Write `data/entities.yaml` with 7 entities in the §4 entry format: `pwd-street-lighting`, `pwd-sidewalks`, `pwd-highway-d07` (potholes, street cleaning), `parks-forestry`, `dcr`, `massdot`, `eversource`. Fill `queues`, `need`, `help`, `cant` and `workload` from the map. Add `hazard` (1–5) per service family and `respondWithin`. Then check that the YAML parses.

**F. Spec `routing-and-priority` (P3).**
> New spec. Sources: build-plan §4–§7. MVP, at most 8 tasks. Pure functions only; the only I/O is `loadEntities`. Only touch `src/core/routing/**`, `src/core/priority.ts`, `src/core/outcomes.ts` and `data/**`.
> - `loadEntities('data/entities.yaml')` with zod validation.
> - `route()` implements the §5 steps in order, with a human-readable reason. It uses `problem.jurisdictionCode` and `problem.roadSegmentId` (precomputed by the ledger) and fills `missing` from the entity's `need` list. Unknown cases go to triage; it never throws.
> - `priority()` uses the §5 formula and returns the factor breakdown plus the "why" string.
> - `OUTCOMES` table: the 9 codes → next problem status, next assignment state, and a resident message template (plain language, grade 8).
> - Property-based tests (fast-check):
>   - priority is monotonic and bounded;
>   - `gap` acts only through the reporter count;
>   - an override always wins;
>   - every problem gets exactly one decision;
>   - every outcome code has a next state and a message.
> - Afterwards, ask Kiro to create a hook: on save of `src/core/**/*.ts`, run `npx vitest run src/core`.

**G. Kiro Web (P3, about 17:00, at app.kiro.dev, Autonomous mode, on this repo).**
> Add resident-message translations for the 9 outcome codes in `src/core/outcomes.ts` as locale files in `data/locales/` (es, ht, zh, vi, pt). Keep the English keys identical. Open a PR.

Review the PR, merge it, then `git pull`.
