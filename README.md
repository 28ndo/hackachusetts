# Dispatch Ledger

> Hackachusetts 2026 · Track: Civic Action · Challenge: More Responsive Neighborhood Services

**Every report becomes one problem, with one owner and one honest outcome.**

Boston's 311 takes in hundreds of reports a day. Three in ten closures come back as "Noted" with no reason and no recorded fix, one in five reports repeats one already filed, and a single boulevard can have three different owners. Dispatch Ledger is the dispatch and accountability layer that sits between 311 intake and the departments, state agencies and utilities that do the work. It works with whatever CRM the city runs underneath.

**Live demo:** [url] · **Video (under 3 min):** [url]

## What it does

- **Firehose → problems.** Ingests 20,730 real Boston Open311 reports (Sep 24 – Oct 24, 2026) and clusters the seven routable types (potholes, streetlights, sidewalks, trees, signals, signs, wires) into problems: same type, within 25 m or on the same road segment, within 14 days.
- **Routing with a "why".** Learned rule → road jurisdiction (MassDOT Road Inventory: DCR parkway, state road, private way) → service type → ops triage. Every packet says why it landed where it did, and the router only hands a problem to a road's agency when that agency actually handles the issue type.
- **Priority you can argue with.** `hazard × people × overdue`, each factor on the card: "7 people waiting · 9 days overdue · hazard 3".
- **Work packets, not case numbers.** Description in the reporter's own words and language, photos, map, honest ETA from the department's real 2024 workload, the crew's checklist with missing items flagged before dispatch, and the full history of hops.
- **Nine outcomes instead of "Noted".** One tap from a short list. Each code moves the problem to a defined next state and produces a plain-language resident message in English, Spanish, Haitian Creole and Chinese. `NOT_OURS` reroutes the packet and teaches the router a rule for that segment, so the next report lands straight at the right owner. "Replay next report" shows it live.
- **Scorecard.** Open, overdue, answered, fixed, rerouted, not found, deferred and median response per entity. Zero "Noted".

## Run it locally

Prerequisites: Node 20+, a Postgres database (we use Neon).

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (and DATABASE_URL_UNPOOLED if you have it)
npm run seed                 # rebuilds the ledger from the Open311 snapshot in under 2 minutes; also the demo reset
npm run dev
```

Without `DATABASE_URL` the app runs on an in-memory fixture built from a handful of real records. `npm test` runs the property-based tests (fast-check) for clustering, routing, priority, outcomes and locales.

## Testing instructions for judges

1. Open `/` for the three views (Ledger, Entity, Resident) and the walkthrough. Open **Ledger**: the funnel shows how many real reports collapsed into how many problems, the entities that own them, and a scorecard. "Many reports, one problem" shows the clusters with the most reporters next to what the city told those residents.
2. Open the **DCR** inbox. Packets are ranked by priority with a "Why #1" line and the routing reason ("DCR parkway segment … per the MassDOT Road Inventory").
3. Open the Morrissey Blvd packet and record **NOT_OURS → MassDOT**. The packet reroutes, the router learns a rule, and the resident preview shows "We sent this to MassDOT, who owns this road."
4. Back in the DCR inbox, click **Replay next report**. The next real report on that segment lands in MassDOT's inbox with confidence "learned".
5. Open the **Street Lighting** inbox and record **FIXED** on a packet with a Chinese-language reporter. Switch the resident preview between English, Haitian Creole and Chinese.
6. Record **DEFERRED_CAPITAL** with "spring 2027" anywhere: the resident sees a target, not "Noted".
7. Open **Resident** for the intake stub (an agentic report form) and every message a resident can get back, in four languages.
8. Return to **Ledger**: the scorecard counts the outcomes, and "What the router has learned" lists the rule.

No login. No real 311 case is ever filed or changed; the banner says so.

## Data sources

| Source | What we use it for | Link |
|---|---|---|
| Boston Open311 (snapshot of 20,730 requests, Sep 24 – Oct 24, 2026) | Reports, descriptions, photos, the city's own closure notes ("before") | https://311.boston.gov/open311/v2/requests.json |
| MassDOT Road Inventory (Boston segments, cached as GeoJSON) | Road owner per segment: City, DCR, MassDOT, private | https://gis.massdot.state.ma.us/ |
| Boston 311 legacy data, 2024 (department map) | Per-queue workload: requests per day, median and 90th-percentile days to close, on-time %, backlog | https://data.boston.gov/ |

Every number in the UI carries its source and date. Photos link to the city's URLs and are never re-hosted.

## Built with

Next.js 16 (App Router, server actions), TypeScript, Tailwind CSS 4, Postgres on Neon, Leaflet, Vitest + fast-check. This repository is a rebuild of the team's earlier Kiro-built attempt, written with Claude Code; see the commit history.

## Team

- Niklas Oberueller, build
- Beltran Thomas, entity catalog and video

## License

MIT
