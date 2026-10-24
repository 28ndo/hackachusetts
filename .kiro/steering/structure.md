---
inclusion: always
---

# Structure

## Who does what (PLAYBOOK §1, since 16:20)

**Niklas is the only developer.** All code is built by Kiro on Niklas's machine, from one spec: `dispatch-ledger` (`research/kiro-spec-dispatch-ledger.md`). The teammates don't write code; they own the video, QA and the write-up. Any agent may edit any code or data folder unless its prompt names narrower folders. That happens when two agents run in parallel: the Kiro IDE on logic and UI, `kiro-cli` on `db/**`, `scripts/**` and `src/db/**`.

Don't edit `README.md`, `KIRO_LOG.md`, `docs/kiro-log/*` (except Niklas's own files) or `research/**`.

**If you change `src/core/types.ts`, say so at the top of your response and show the diff.**

## Folder layout

```
research/open311/boston-open311-2026-09-24_to_2026-10-24.json   (20,730 real Boston reports)
data/                 entities.yaml, service-families.yaml, boston-roads.geojson (cached), locales/en.json, locales/ht.json
db/                   schema.sql
scripts/              seed.ts (also the demo reset)
src/
  core/
    types.ts          the shared contract (announce changes)
    priority.ts       priority()
    outcomes.ts       OUTCOMES table
    routing/route.ts  route()
  ledger/
    cluster.ts        cluster(), addReport()
  db/
    repo.ts           PostgresRepo
    getRepo.ts        PostgresRepo when DATABASE_URL is set, else fixtureRepo
  workflow/
    applyOutcome.ts   applyOutcome()
    fixtureRepo.ts    in-memory Repo for dev and tests
  app/                Next.js App Router pages
  components/         UI
```

## Interfaces (PLAYBOOK §2)

These live in `src/core/types.ts`. The UI can run on `fixtureRepo` until `PostgresRepo` lands; `getRepo()` switches automatically.

```ts
// src/ledger/cluster.ts
cluster(reports: Report[]): Problem[]                                  // batch, for the seed
addReport(report: Report, nearbyOpen: Problem[]): Problem              // runtime, for the replay button

// src/core/routing/route.ts, src/core/priority.ts, src/core/outcomes.ts
route(problem: Problem, ctx: { entities: Entity[]; overrides: RoutingOverride[] }): RoutingDecision
// RoutingDecision = { entityId, queue?, reason, confidence: "learned"|"jurisdiction"|"rule"|"triage", missing: string[] }
priority(problem: Problem, entity: Entity, now: Date): Priority      // { score, hazard, people, overdue, gap, why }
OUTCOMES: Record<OutcomeCode, { nextProblemStatus; nextAssignmentState; needs?; residentMessage(o): string }>

// src/workflow/applyOutcome.ts
applyOutcome(repo: Repo, assignmentId: string, outcome: Outcome): Promise<StateChange>

// src/db/repo.ts implements Repo against Neon Postgres
interface Repo { listInbox; getProblem; recordOutcome; createAssignment; updateAssignment;
                 updateProblem; addOverride; listOverrides; scorecard; ingestReport; nextReplayReport }
```

## How the pieces fit (PLAYBOOK §2)

```
boston-open311 snapshot
        │
        ▼  npm run seed   (offline pipeline and demo reset; rebuilds the DB in under 2 min)
   normalize → familyOf → cluster → enrich (road owner from cached geojson) → route() + priority() → Postgres
        │
        ▼  Next.js app on Vercel
   inbox / packet / outcome ──► applyOutcome() ──► NOT_OURS: route() again + RoutingOverride row
                                                   "replay next report" → addReport() → route() → lands with new owner
```
