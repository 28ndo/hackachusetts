---
inclusion: always
---

# Tech

## Stack (PLAYBOOK §3; change only if the ledger owner already started on something else)

- Next.js (App Router) with TypeScript strict, and Tailwind
- Postgres on **Neon** (create it from Vercel → Storage → Neon, so `DATABASE_URL` is set for you), using the `postgres` client
- **Vercel** auto-deploys every push to `main`. A failed build doesn't replace the live site.
- Vitest and **fast-check** for tests; `tsx` for scripts; Leaflet for the map

## Commands

- `npm run dev` — run the Next.js app locally
- `npm test` — run the Vitest suite
- `npm run seed` — rebuild the database from scratch (offline pipeline, under 2 minutes)

## Rules

- **No external API calls at request time.** All external lookups (MassDOT road owner, census block group, EJ polygons) happen in the seed pipeline and are cached. The deployed app never calls an outside API.
- **Property-based tests use fast-check.** Clustering invariants, priority/routing/outcome invariants, and locale coverage are expressed as properties, not just examples.
