# Build plan v2: the dispatch and accountability layer

**Status: PROPOSED.** Edit anything you disagree with, then use this file as context when generating Kiro specs (`#file:research/build-plan.md`).
Deadline 20:00 sharp, video included. Team of 3. Kiro credits: unlimited.

---

## 1. Positioning

> **Every report becomes one problem, with one owner and one honest outcome.**
> We sit between 311 intake and the departments that do the work. We turn raw reports into problems, route each one to its real owner with a complete work packet, and give every owner a one-tap way to say what they did. Each answer makes the routing smarter.

- **Where we sit:** intake (BOS:311 app, phone, and later a resident's civic agent) → **us** → city departments, state agencies, utilities → status back to residents through the existing channels.
- **Don't say** "we rebuild the backend." Boston is replacing its CRM right now (Creatio, about $6M, done end of 2026). **Say** "the dispatch and accountability layer 311 is missing," which works with whatever CRM sits underneath.
- **Intake is real today, and we use it.** We ingest the **live Boston Open311 feed**: real reports with descriptions and photos. The civic-agents RFC is a draft; agent submissions are its Phase 2 "near-term," not built. Pitch it as: "whatever the front door, reports land here."
- **Resolving "they won't change behavior":** the protocol **replaces the free-text closure comment they already write.** It is one tap from a short list, plus an optional note or photo. The effort is the same as today, but the output is structured and triggers the next step automatically. That makes the 30% "Noted" closures the pitch hook.

## 2. Users

| User | We simulate them as | What they get |
|---|---|---|
| **Entity dispatcher or crew lead** (PWD Highway, Street Lighting, DCR, MassDOT…) | Entity inbox with a switcher ("view as DCR") | A ranked queue of work packets: what, where, photos, how many people are waiting, priority and why, response-by date. One tap to record the outcome. |
| **311 operations / ledger steward** | Ops view | Clusters, routing confidence, stale assignments, closures that didn't hold, entity scorecards |
| **Resident** (receives, doesn't submit) | Resident preview panel in the entity inbox (Must); full status page (Should) | A plain-language outcome instead of "Noted," e.g. "Scheduled for repaving, spring 2027," **in their own language** (§5b). |

Equity shows up in three places. Say all three out loud in the video:
1. **The priority score**, through the reporting-gap weight (§5).
2. **The return path in the resident's language** (§5b).
3. **The language-isolation and income lenses** on the accountability view (§5b).

## 3. Data model (the contract; agree on it before anyone builds)

```
Report        raw intake (one Open311 request)
  id, source ("open311"|"agent"|"phone"|"employee"), serviceName, description, lat, lon, address,
  mediaUrl, requestedAt, problemId,
  preferredLanguage?   # from the intake's "-- original (xx-XX) --" tag, or a future agent/app field; default "en"

Problem       one real-world issue (a cluster of reports)
  id, serviceFamily, lat, lon, roadSegmentId?, neighborhood, blockGroupId?,
  ejCriteria?: string, limitedEnglishPct?: number,   # MassGIS EJ2020 join at ingest; lens only, never in priority (§5b)
  reportIds[], reporterCount, firstReportedAt, lastReportedAt,
  status: new | routed | acknowledged | in_progress | resolved | deferred | not_actionable,
  priority: { score, hazard, people, overdue, gap, why: string }

Assignment    a work packet sent to one entity (a problem can have several over time, e.g. after a reroute)
  id, problemId, entityId, attempt, sentAt, respondBy, resolveBy,
  routingReason: string, confidence: "rule"|"jurisdiction"|"learned",
  state: sent | acknowledged | in_progress | closed | rerouted | stale

Outcome       the entity's structured answer (replaces "Noted")
  id, assignmentId, code (see §6), note?, photoUrl?, scheduledFor?, newOwnerId?, by, at

RoutingOverride   what the system learned
  serviceFamily, roadSegmentId | areaKey, entityId, learnedFrom: outcomeId, createdAt

Entity        from the catalog (§4)
```

**Clustering rule (v1):** same `serviceFamily`, within **25 m** (or the same road segment), reported within **14 days** of the problem's last report, and the problem is not resolved. A new report on a resolved problem within 30 days gets the flag **closure didn't hold**.

## 4. Entity catalog

**Source:** the team's [Boston 311 Department Map](https://claude.ai/artifact/HkE1suC11j1WoFu9xKKNh2), exported to [`department-map.json`](department-map.json). It covers 16 departments, 168 queues and 97 request types, built from 306,756 cases in 2024. Spot-checked against the raw 2024 data: the numbers match. The app reads `data/entities.yaml`, built from this file, and no entity details are hardcoded.

**What the map changes:**

1. **Route to queues, not departments.** Boston dispatches to 168 queues across 16 departments (e.g. `PWDx_District 07: South Dorchester`, `PARK_Maintenance_Region 1–6`). An entity has queues; the router picks the queue by request type (`mainTypes`) and district. Outside agencies stay at one level.
2. **"Sufficient information" becomes a checklist per entity and request type.**
   - `need` lists what is required, and `help` lists what is optional. Both come from the department and the request type (e.g. streetlight: pole number or nearest address; tree: the address it's in front of, plus whether it's on wires or blocking the road).
   - A packet missing a required item is held, and the question goes to the reporters **before dispatch**. `NEEDS_INFO` moves upstream, before a crew rolls.
3. **Every department's "can't" list becomes a routing rule.** Each item turns into a check run before dispatch, and the checks feed router step 2 (§5):

   | Department | Can't (from the map) | Check |
   |---|---|---|
   | Public Works | Private ways and property; state roads and DCR parkways; utility road cuts | `Jurisdictn` H or 0 → private; 1 → MassDOT; 3 → DCR; utility cut → triage |
   | Transportation | MBTA property; state roads; private lots | MBTA stop within 20 m; `Jurisdictn` 1 |
   | Parks | Private trees; DCR parks; trees in power lines | "On wires" → Eversource; DCR park layer (Should) |
   | BWSC | Gas, electric and telecom covers | Cover type → utility |
   | ISD | Inspect without unit access | `NEEDS_INFO`: unit number and tenant contact |

4. **Honest ETAs from real workload.** Each queue has requests per day, median and 90th-percentile days to close, the city's deadline, on-time %, and backlog. The packet's `resolveBy` and the resident message use them, e.g. "Usually fixed in 10 days; 9 in 10 within 6 months."
5. **The scorecard gets a "before."** Each queue's 2024 closure quality is the baseline the demo improves on: % duplicate, missing info, wrong owner, invalid, and no evidence found.
6. **Every hop becomes visible.** The public data shows only a case's final queue, so today nobody can see how often a case bounced between queues. Our Assignment log records every hop, which is new data the city doesn't have.

**New pitch fact (✅ verified, add to §8):** in 2024 Boston handed **4,190** cases to DCR, MassDOT, the MBTA, Eversource and Massport through its `INFO_` referral queues. **3,538 (84%) never got a closure back.** On time: DCR 9.9%, MassDOT 3.8%, MBTA 3.8%. The handoff is where cases disappear.

**Demo entities (2024 numbers from the map):**

| Entity → queue | Handles | Per day | Usual close / 9 in 10 within | City deadline | On time | Still open |
|---|---|---|---|---|---|---|
| PWD → Street Light Outages | Streetlights | 10.0 | 10 d / 185 d | 15 d | 48.7% | 312 |
| PWD → Sidewalk Repair | Sidewalks | 7.6 | 2.7 d / 528 d | 1.4 d | 14.7% | 2,072 |
| PWD → District 07: South Dorchester | Potholes, street cleaning | 10.8 | 0.07 d / 1 d | 1.2 d | 94.9% | 0 |
| Parks → Tree Maintenance Request | Street trees | 20.0 | 22 d / 161 d | **365 d** | 99.0% | 2 |
| DCR (via `INFO_Mass DCR`) | Parkways, DCR parks | 6.8 | — | 3 d | 9.9% | 1,992 |
| MassDOT (via `INFO_Mass DOT`) | State roads | 2.0 | — | 1.6 d | 3.8% | 697 |
| Eversource (via `INFO_Eversource`) | Utility poles, wires, trees on wires | 0.4 | — | 3 d | 16.9% | 131 |

Parks is "99% on time" only because its deadline is a year. That's another reason the packet shows an honest ETA, not an on-time %.

**Entry format:**

```yaml
- id: pwd-street-lighting
  name: Public Works, Street Lighting
  kind: city_dept                 # city_dept | state_agency | utility | other_town | authority | private
  department: PWDx                # key in department-map.json
  queues: ["PWDx_Street Light Outages", "PWDx_Street Light Outages - Long-Term Repair"]
  owns: [streetlight]             # service families
  where: { jurisdictionCodes: ["2"] }    # MassDOT Road Inventory: 0 unaccepted, 1 MassDOT, 2 City, 3 DCR, 5 Massport, B state college, H private
  need: ["Pole number (tag on the pole) or nearest address"]
  help: ["Out, flickering, or on during the day", "Photo that shows the surroundings"]
  cant:                           # each one is a pre-dispatch check
    - { rule: "State roads and DCR parkways", check: "Jurisdictn in [1, 3]", sendTo: [massdot, dcr] }
    - { rule: "Private ways and private property", check: "Jurisdictn in [0, H]", outcome: PRIVATE_PROPERTY }
  workload: { perDay: 10.0, medianDays: 10.0, p90Days: 184.5, slaDays: 15, ontimePct: 48.7, open: 312 }
  respondWithin: 48h

- id: dcr
  name: Department of Conservation and Recreation
  kind: state_agency
  queues: ["INFO_Mass DCR"]       # today's handoff: a 311 referral queue
  owns: [pothole, sidewalk, streetlight, tree, litter]
  where: { jurisdictionCodes: ["3"] }
  need: [streetName, nearestCrossStreet, roadSegmentId, "What the problem is"]
  help: [photo, reporterCount]
  handoffToday: { ontimePct: 9.9, stillOpen: 1992, referredOnPct: 52.3 }
  respondWithin: 48h
  contact: "verify before the demo"
```

**Caveats:**
- Workload and quality figures are 2024 legacy-system data. The new system uses different team names (`assigned_team`), so present these as the 2024 baseline.
- The map's checklists are suggestions mined from closure comments; label them that way.
- Ignore the `own` field under `workload`; its meaning is undocumented.

## 5. Routing and priority (explainable; no ML)

**Routing, in order. The first match wins, and the result always carries a "why":**
1. **Learned override** for this service family and road segment or area → "Learned: DCR rerouted this segment to MassDOT on 10/24."
2. **Jurisdiction:** query the MassDOT Road Inventory `Jurisdictn` at the point (20 m buffer). Code 3 → DCR, 1 → MassDOT, 5 → Massport, H → private, and City ≠ 35 → other town.
3. **Service type:** catalog `owns`, for city-owned roads and anything off-road.
4. **Ambiguous (Should):** when two owners are plausible (e.g. "contractor left a mess": a private job goes to ISD, a public one to PWD), send it to triage with the **one deciding question** attached, instead of guessing.
5. **No match:** send to the ops triage queue. Never drop it.

**Priority = hazard × people × overdue**, showing each factor on the card. *(Updated after the Yao thesis; see [yao-thesis-notes.md](yao-thesis-notes.md).)* `gap` now scales the reporter count only, because counting reporters is the one signal that amplifies reporting gaps. It never touches hazard or lateness.

| Factor | Definition |
|---|---|
| `hazard` | 1–5 per service family, from the catalog. Downed wire = 5, pothole = 3, streetlight = 2, litter = 1. |
| `people` | 1 + log2(reporterCount × gap), so 1 report → 1, 4 → 3, 8 → 4 when gap = 1. Card copy: "7 people waiting (counts as 9: this block reports less than most of Boston)." |
| `overdue` | 1 + min(hoursPastTarget / targetHours, 2), capped at 3 |
| `gap` | 1 + 0.25 × clamp(−custodianship, 0, 2), giving 1.0 to 1.5. `custodianship` is BARI's 2024 z-score for the report's census block group (below). Fallback if the BARI file isn't available: 1.25 in an EJ block group, otherwise 1. **Never derive `gap` from race or ethnicity; use only the measured reporting rate.** |

**Reporting-gap data (BARI, Harvard Dataverse doi:10.7910/DVN/CVKM87, CC0):**
- **Data file:** `311 Ecometrics CBGs Vertical 2020 Geographies.tab` (1.6 MB). It has one row per block group per year (2010–2024). `Custodianship` is a z-score: mean 0, SD 1, and low means fewer residents report public issues.
- **Join key:** `BG_ID_20`, the 12-digit Census GEOID.
- **Lat/lon → GEOID:** call `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x={lon}&y={lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json`. No key needed; it is slow, so call it once per problem and cache the result.
- **Card copy:** "This block reports less than most of Boston (BARI custodianship, 2024), so each report here counts more."
- **Download:** Dataverse requires a guestbook form (name and email), which a teammate fills in.

The card reads like: **"Why #1: 7 people waiting · 9 days overdue · hazard 3 · low-reporting area."**

## 5b. Language and EJ: where each one belongs

Both were checked against live data on 2026-10-24. **Language belongs on the return path; EJ belongs in the audit view, not the priority score.**

**Language: intake is already handled; the return path isn't.**
- **Intake already translates.** In 5 days of live Open311 reports (2,982, Oct 17–21), the BOS:311 app auto-translated non-English reports and tagged the original. 38 reports (**1.3%**) were written in another language: 25 in Chinese, **3 in Spanish**, and **0 in Haitian Creole or Vietnamese**. That is despite 15% of Bostonians speaking Spanish at home. Non-English speakers aren't using the app; they call. Mattapan files 63% of its cases by phone.
- **Nothing translates what comes back,** because what comes back is free-text "Noted." Free text can't be reviewed before it's sent. **Nine outcome codes can:** 9 templates × 10 languages = 90 strings, which the city's Office of Language and Communications Access could review once.
- **Build:**
  - `messages/<locale>.json` with one resident message per outcome code. Languages: English, Spanish, Haitian Creole, Chinese (Simplified and Traditional), Vietnamese, Cape Verdean Creole, Portuguese, Somali, Arabic. boston.gov's own menu lacks Haitian Creole, Vietnamese and Cape Verdean Creole.
  - Generate them with a **Kiro hook**: saving `en.json` regenerates the other locales.
  - Label them in the UI as "machine-drafted, pending city language review."
  - `Report.preferredLanguage` comes from the original-locale tag. The status page renders in that language, with a switcher.
  - Phone reporters don't get app notifications, so show the same message as a simulated SMS.
- **Demo:** use a **real** Chinese report from the feed. Street Lighting taps `FIXED`, and the reporter's status appears in Chinese, then switch to Haitian Creole.
- **Pitch line:** "Boston's app already translates what residents send in. Nothing translates what the city sends back, because what it sends back is 'Noted.' Structured outcomes can be translated once, reviewed once, and sent in every language."

**EJ: an audit lens, not a weight.**
- **Most of Boston is EJ-designated:** **462 of about 582 Boston block groups (~79%)**, and 274 of those qualify on the minority criterion alone (MassGIS EJ2020; Census TIGERweb count).
- **As a priority weight it would barely discriminate and would break our no-race rule,** so BARI custodianship stays the weight (§5).
- **Use EJ to check outcomes instead,** with two sharper slices from the same layer:
  - **Language-isolated blocks:** 73 Boston block groups meet the "English isolation" criterion. `LIMENGHHPCT` is the share of households with limited English; 66 block groups are at 25% or more.
  - **Income blocks:** 161 Boston block groups meet the income criterion.
- **Build:**
  - At ingest, point-in-polygon each problem against the Boston EJ polygons, fetched once and cached as GeoJSON from `arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0` with `where=MUNICIPALITY='Boston'&returnGeometry=true&outSR=4326&f=geojson`.
  - Add a scorecard column comparing language-isolated and income blocks against the rest of Boston: median wait, overdue %, `NOT_FOUND` and handoff share.
  - Add a map layer toggle.
- **Pitch line:** "We weight by who doesn't report, using measured reporting rates, not demographics. Then we audit outcomes by language isolation and income, so the city can see whether the fix reached everyone."
- The organizers listed this exact dataset for challenge V2, which counts toward "unique public resources."

## 6. Outcome codes: the protocol that replaces "Noted"

| Code | Entity taps | What happens next, automatically | Resident sees |
|---|---|---|---|
| `FIXED` | + optional photo | Problem resolved; watch 30 days for re-reports | "Fixed on Oct 24" (+ photo) |
| `MADE_SAFE` | + follow-up date | Stays open with a scheduled follow-up | "Made safe; full repair scheduled for …" |
| `SCHEDULED` | + date | State becomes in_progress; nudge if the date passes | "Scheduled for Nov 3" |
| `DEFERRED_CAPITAL` | + target quarter | Problem deferred; counted separately from failures | "Needs a larger project; target spring 2027" |
| `NOT_OURS` | + pick the real owner | **Reroute plus a learned override** | "Sent to MassDOT, who owns this road" |
| `NOT_FOUND` | + note | Ask **every reporter on the problem** for a photo or confirmation; close if no reply in 7 days | "Crew couldn't find it; can you send a photo?" |
| `PRIVATE_PROPERTY` | — | Close with who to contact | "This is private property; here's who to contact" |
| `DUPLICATE` | + link | Merge problems | (merged) |
| `NEEDS_INFO` | + what's missing | Request goes to **every reporter on the problem** (many reporters make it more likely someone left contact info) | "The crew needs: …" |

Rules: **no free-text-only closure**, and every code maps to a plain-language resident message.

## 7. Keeping the database healthy

| Job | Rule |
|---|---|
| Merge and split | Clustering per §3; a manual merge happens through `DUPLICATE` |
| Stale assignments | Past `respondBy` with no acknowledgment → state `stale` → escalate on the ops view |
| Closure didn't hold | A re-report within 30 days of `FIXED` → reopen and count against the entity's reopen rate |
| Orphans | No owner → triage queue (never silently dropped) |
| Entity scorecard | Acknowledgment time, on-time %, reroute rate, reopen rate, share of `NOT_FOUND` |

**Property-based test targets** (Kiro IDE, fast-check):
- every report belongs to exactly one problem;
- a re-report on an open problem never closes anything: it increments `reporterCount` and refreshes `lastReportedAt`;
- `gap` acts only through the reporter count: `priority(p, gap)` equals `priority(p with reporterCount × gap, gap = 1)`, and `gap` never lowers priority;
- clustering is order-independent and idempotent;
- every non-triage problem has exactly one active assignment;
- priority is monotonic in reporters, hazard and overdue, and bounded;
- every outcome code maps to a next state and a resident message;
- every outcome code has a resident message in every supported locale, with the same placeholders (`{date}`, `{owner}`) as English;
- EJ fields never change a problem's priority (`priority(p)` is the same with or without `ejCriteria`);
- an override, once learned, always wins over jurisdiction routing.

## 8. Real numbers to use (Boston new-system data)

**City targets to *close the case* (median `target_close_date − open_date`).** These are not fix deadlines. The pothole target is a flat 24 calendar hours on 2,352 of 2,357 cases, and `on_time` just means "closed before the target." Closing the case is not the same as fixing it: of 1,859 closed pothole cases, only **240 (13%)** say repaired, filled or completed. **547 (29%)** were handed off or cited (e.g. "We have notified BWSC, and they are scheduling repairs," "Violation issued" to a contractor, or reallocated to a non-city owner), and **744 (40%)** have no comment at all.

So our model uses **three clocks** per service type instead of one: `acknowledgeBy` (default 24h), `makeSafeBy` (pothole: the city's 24h patch standard), and `fixBy` (pothole: weeks; repaving can be a capital project). These map onto the `MADE_SAFE` / `FIXED` / `DEFERRED_CAPITAL` outcome codes.

| Service | City close-the-case target |
|---|---|
| Pothole | 24h |
| Sidewalk | 24h |
| Litter | 24h |
| Missed trash | 24h |
| Park equipment | 48h |
| Fallen tree | 72h |
| Pruning | 72h |
| Graffiti | 72h |
| Streetlight outage | 336h |

**Actual on-time rates:**

| Service | On time |
|---|---|
| Pothole | 29.8% |
| Sidewalk | 17.7% |
| Streetlight | 45.5% |
| Litter | 87.9% |

**Pitch hooks:**
- About 30% of closures are "Noted."
- About 21% of reports repeat an earlier one.
- 82% of open cases are already overdue.
- Morrissey Blvd has 3 owners (DCR 9 segments, MassDOT 4, UMass 1).
- 84% of 2024 cases handed to DCR, MassDOT, the MBTA, Eversource or Massport never got a closure back (3,538 of 4,190).
- In 5 days of app reports, 3 of 2,982 were written in Spanish, and none in Haitian Creole or Vietnamese. 15% of Bostonians speak Spanish at home.
- ~79% of Boston block groups are EJ-designated, so we audit with sharper slices: 73 language-isolated, 161 income.

## 9. Demo storyboard. Decide it first, then build only what's on screen.

| Time | Scene |
|---|---|
| 0:00–0:20 | **Hook:** "3 in 10 Boston 311 cases close as 'Noted,' with no reason and no recorded fix. 1 in 5 reports repeats one already filed. Morrissey Boulevard has three owners." |
| 0:20–0:50 | **Firehose → problems:** a day of real Boston 311 reports replays into the ledger, and about 800 reports collapse into N problems. Open a streetlight problem with 6 reports. |
| 0:50–1:30 | **Routing + work packet:** a pothole on Morrissey Blvd. The router says "DCR segment (MassDOT Road Inventory)." It lands in the DCR inbox with the full packet and "why #1." |
| 1:30–2:10 | **Entity outcomes:** DCR taps `NOT_OURS → MassDOT`. The problem reroutes and the rule is learned, so the next report on that segment goes straight to MassDOT (show it). Street Lighting taps `FIXED` with a photo, and the resident preview panel shows the real Chinese-language reporter's message in Chinese (switch to Haitian Creole). Highway taps `DEFERRED_CAPITAL`, and the resident sees "spring 2027" instead of "Noted." |
| 2:10–2:35 | **Accountability:** entity scorecards, zero "Noted" outcomes, who's waiting, and how low-reporting areas are weighted. Toggle the language-isolated blocks layer to compare their wait times with the rest of Boston. |
| 2:35–3:00 | **Kiro + scale:** specs, a property-based test catching a clustering bug, hooks, the City's OpenContext MCP. Close: "Any front door (311 app, phone, or a resident's AI agent) lands here. 351 Massachusetts towns, one router." |

## 10. Scope (revised 16:20: solo driver, Postgres kept)

Built from one Kiro spec, `dispatch-ledger`: [research/kiro-spec-dispatch-ledger.md](kiro-spec-dispatch-ledger.md).

- **Must (the demo path, §9 scenes 2–4):**
  - **Seed into Neon:** all 20,730 snapshot reports go in (for the counter). Routable families (streetlight, pothole, sidewalk, tree, signal, sign, wire) are clustered into problems.
  - **Road owner offline:** nearest MassDOT segment from a cached geojson. The fallback is the 150 cached checks.
  - **Routing in 4 steps, each with a "why":** learned override → jurisdiction → family → triage.
  - **Priority with its factors.**
  - **Entity inbox** with a switcher and a work packet (need/help checklist, photos).
  - **The 9 one-tap outcome buttons,** each with its automatic next step.
  - **Resident preview panel** in English and Haitian Creole.
  - **`NOT_OURS` reroute plus a learned override,** and **"Replay next report"** landing on the learned owner.
  - **Overview:** "20,730 reports → N problems → M routed", plus the scorecard.
  - **Public deploy.**
- **Should, only if the 17:45 cut line is met:**
  - map;
  - more languages;
  - resident status page `/p/[id]`;
  - stale escalation;
  - "closure didn't hold".
- **Pitch only (say it, don't build it):**
  - the EJ / language-isolation lens;
  - the reporting-gap weight from BARI;
  - three clocks (acknowledge, make safe, fix);
  - chronic hotspots;
  - the ambiguous-owner path;
  - simulated SMS.
- **Won't:**
  - intake UI;
  - auth;
  - real emails or POSTs to any entity or to 311;
  - ML.

## 11. Roles and schedule (revised 16:20)

| Person | Job | Writes |
|---|---|---|
| **Niklas** | The only developer. Kiro IDE runs the logic and UI; `kiro-cli` optionally runs the database path in parallel. Also Neon, deploy, and the Neon power. | All code and data |
| **P3: Beltran** (entity catalog ✓) | **Story:** video script and voiceover, the 20-second stats intro, Kiro footage as it happens. Drives the recording at 18:15. | `docs/**`, video |
| **P2: DB teammate** | **QA, review and submission:** tests every deploy against §9, reviews Kiro's SQL and schema (read-only), collects Kiro screenshots, drafts the README, testing instructions and submission text, compiles `KIRO_LOG.md` at 19:15. | `README.md`, `KIRO_LOG.md`, `docs/**` |

| Time | Milestone |
|---|---|
| 16:20–16:35 | Neon connected locally and on Vercel; Neon power installed; spec generated; teammates switched to their new jobs |
| **17:15** | **Cut line 1:** Neon seeded, and `/inbox/dcr` renders from Postgres on the live URL |
| **17:45** | **Cut line 2:** outcome buttons, `NOT_OURS` reroute and replay work on the live URL |
| **18:15** | **Feature freeze**; reseed production (the demo reset) |
| 18:15–19:15 | Record and edit the video; upload it **publicly** (YouTube or Vimeo) |
| 19:15–19:45 | `KIRO_LOG.md` write-up, README, submission form |
| **19:45** | **Submit.** 15 minutes of buffer. |

**Guardrails:**
- Never POST to real 311 or email a real agency; every send is simulated and labeled.
- All app code is built in Kiro and lives in one repo with `.kiro/` committed.
- Log Kiro moments as they happen.
