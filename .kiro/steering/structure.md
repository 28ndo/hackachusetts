---
inclusion: always
---

# Structure

## Who does what (PLAYBOOK §1)

| | **Niklas: the app** | **P2: the ledger** (DB teammate) | **P3: the brain and the story** (mapping teammate) |
|---|---|---|---|
| Builds | Entity inbox, work packet, outcome buttons, reroute + learn, scorecard, ops view, resident status page, map; deploy and integration | Postgres schema, all SQL, snapshot ingest, enrichment (road owner, block group), clustering, seed script, hygiene queries | `data/entities.yaml`, `route()`, `priority()`, outcome-code table and resident messages. **From 17:00:** video, README, Kiro write-up |
| Kiro spec | `entity-workflow` | `problem-ledger` | `routing-and-priority` |
| Owns (only you edit these) | `src/app/**`, `src/components/**`, `src/workflow/**` | `db/**`, `scripts/**`, `src/ledger/**`, `src/db/**` | `data/**`, `src/core/routing/**`, `src/core/priority.ts`, `src/core/outcomes.ts`, `docs/**` |

### Shared files with a single owner

- `src/core/types.ts` and `.kiro/steering/**`: Niklas. Say it in chat before changing them.
- `package.json`: announce in chat, `git pull`, install, then commit `package.json` and `package-lock.json` immediately.

**Never edit `src/core/types.ts` without saying so explicitly in your response** (both teammates build against it; show the diff).

## Folder layout

```
research/open311/boston-open311-2026-09-24_to_2026-10-24.json   (20,730 real Boston reports)
data/                 entities.yaml, cached lookups (roads, EJ polygons), locales
db/                   schema.sql                                    (P2)
scripts/              seed.ts                                       (P2)
src/
  core/
    types.ts          the shared contract (Niklas owns)
    priority.ts       priority()                                    (P3)
    outcomes.ts       OUTCOMES table                                (P3)
    routing/route.ts  route()                                       (P3)
  ledger/
    cluster.ts        cluster(), addReport()                        (P2)
  db/
    repo.ts           Postgres Repo                                 (P2)
  workflow/
    applyOutcome.ts   applyOutcome()                                (Niklas)
    fixtureRepo.ts    in-memory Repo for dev                        (Niklas)
  app/                Next.js App Router pages                      (Niklas)
  components/         UI                                            (Niklas)
```

## Interfaces (PLAYBOOK §2)

These live in `src/core/types.ts`. Stubs exist from minute one; build against `fixtureRepo` until the real piece lands.

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

## How the pieces fit (PLAYBOOK §2)

```
boston-open311 snapshot
        │
        ▼  P2: npm run seed   (offline pipeline, rebuilds the DB in ~2 min)
   normalize → enrich (road owner, block group; cached) → cluster → route() + priority() → Postgres
        │
        ▼  Niklas: Next.js app on Vercel
   inbox / packet / outcome ──► applyOutcome() ──► NOT_OURS: route() again + RoutingOverride row
                                                   "replay next report" → addReport() → route() → lands with new owner
```
