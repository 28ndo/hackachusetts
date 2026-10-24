# Boston 311: research brief and 6-hour build plan

Hackachusetts, Civic Action track, challenge V2 ("Volume hides who is waiting, and who an alert misses. Triage the pattern."). Researched 2026-10-24. Numbers marked ✅ were re-run live against the city's APIs today; "est." marks heuristics.

---

## TL;DR

- **311 doesn't break at "connect the resident to the department."** Boston routes most cases fine and is faster than Chicago, SF, LA and Philly (Boston Globe, Jan 2026). It breaks at what comes after the handoff.
- **The root cause: 311's unit of work is the case (one person's report), not the problem (one pothole).** So:
  - duplicates get closed as noise, which hides how many people are waiting;
  - "closed" means the paperwork closed, not that the problem was fixed;
  - the on-time clock measures the paperwork;
  - report volume reflects who complains, not where the need is.
- **Boston is already replacing the back end.** The new back office is Creatio, a case-management system, plus Cartegraph, a work-order system, at about $6M, finishing end of 2026. Don't pitch "replace 311" to a City of Boston judge. Pitch the missing layer on top: **a problem ledger, plus a resident agent that closes the loop**, built on the city's own Open311 API.
- **A plain "AI chatbot for 311" is saturated.** Boston ran a 311 agent hackathon in April 2026. Our edge has four parts:
  - **problem-level tracking:** many reports, one problem;
  - **verified closure:** a fix counts only when it's confirmed;
  - **jurisdiction routing beyond the city:** state agencies, the MBTA, utilities, neighboring towns;
  - **a who's-waiting triage queue:** adjusted for neighborhoods that report less.
- **Agents filing on residents' behalf is the city's own next step, and nobody has built it.** It is Phase 2 ("near-term") in the Massachusetts civic-agents RFC that Boston co-wrote.

---

## 1. What 311 actually is

"Connect citizens to the departments that fix it" covers only the first two of four jobs:

| Job | How Boston does it today | Where it breaks |
|---|---|---|
| **1. Intake** (what and where) | App (BOS:311), web, phone 24/7, city-worker app | Phone-first and non-English residents are underserved (§2) |
| **2. Route** (who owns it) | Case types map to departments; non-city issues go to manual email queues | DCR, MassDOT, MBTA, utilities and neighboring towns get a closure and a phone number, not a handoff |
| **3. Prioritize** (what goes first) | A fixed clock per case type (e.g. pothole 24h, streetlight 14 days) | Ignores how many people are waiting, the hazard, and who doesn't report |
| **4. Close the loop** (prove it's fixed) | Closure reason plus a free-text comment | About 3 in 10 closures are "Noted"; the resident can't dispute; no proof of fix |

Most of the brokenness is in jobs 3 and 4. That's also what the organizers' challenge asks for: "triage the pattern."

---

## 2. What's broken: the evidence

### From Boston's own data

| Finding | Number | Source |
|---|---|---|
| Potholes fixed within the 24h target | **29.8%** ✅ (n=2,357; median 45h) | New-system data, Aug 2025 to Oct 2026 |
| Sidewalk repair on time | **17.7%** ✅ (n=2,752) | same |
| Streetlight outages on time | **45.5%** ✅; median **325h (~13.5 days)** | same |
| Open cases already past their target | **7,840 of 9,580 (82%)** ✅ | same |
| Closed cases marked "Noted" (no work recorded) | **~30%** ✅ of 256,838 closed in 2024 (my count 29.7%, agent's broader parse 31.8%) | Legacy 2024 |
| Closures with an explicit no-fix signal (invalid, duplicate, not found, referred, private, auto-closed) | **≥13.4%**, up to **24.5%** including canned or blank text (est.) | Legacy 2024 |
| Parking cases closed with one form letter | **~21.8K** (45% of closed parking cases) | Legacy 2024 |
| Reports that repeat a same-type report within ~10m in 14 days | **21.5%** (est.); only **2.3%** of closures are labeled "duplicate" | Legacy 2024 |
| Pothole reports filed while an earlier report at the same spot was still open | **15%** (est.) | Legacy 2024 |
| 2024 cases still "Open" in Sept 2026 | **16.3%** (49,918, incl. 3,327 potholes) | Legacy 2024 |
| Cases auto-labeled ONTIME because they have no SLA target | **15.9%**; true SLA on-time is 72.0%, not the reported 76.5% | Legacy 2024 |
| Phone share of cases, by neighborhood | **Mattapan 62.6%, Hyde Park 54.4%** vs **South End 21.3%, Back Bay 22.8%** ✅ | New system |

Verbatim closures that make the point:
- "We apologize for the time it has taken to respond to this case. We now consider this service request closed. If this issue persists please resubmit…" (rodent case)
- "Per Public Works: Please resubmit with a picture and a more specific description of the pothole."
- "Case Referred to External Agency" (squalid living conditions case)

### From research and reporting

- **Who reports is skewed.** A Harvard Kennedy School brief commissioned by Boston DoIT (2025, 2023 tract data) found:
  - each +$1k of tract median income adds 0.20 requests per 100 residents;
  - each +1pp white share adds 0.26 per 100 (both p<.01);
  - the average is 42 per 100.
  - [HKS brief](https://www.hks.harvard.edu/sites/default/files/2026-02/Maya%20PAE%20Brief.pdf)
- **Reporting is hyper-local.** About 80% of Boston reports are filed within 2 blocks of the reporter's home (O'Brien / BARI, Northeastern). Shared spaces and low-"custodianship" areas go invisible.
- **Showing the fix drives engagement.** In a Boston field study (Buell, Porter & Norton, *M&SOM*), residents shown a photo of the completed work submitted **60% more requests** across **38% more categories**. This is the strongest argument for a "proof of fix" loop.
- **Agencies blame each other.** In a Feb 2025 Boston 25 investigation, the City, MassDOT and DCR each pointed to another over a sign stub that injured a pedestrian. It was removed more than a year after the first report, and only after reporters asked.
- **Language gaps:**
  - 37% of Bostonians speak a non-English language at home.
  - Phone interpretation reached only about 6,000 calls in 2025 (~2% of calls).
  - boston.gov's translation menu has 6 languages, with no Haitian Creole or Vietnamese.
  - Only 2.3% of app-survey respondents answered in a non-English language (HKS).
- **"Closed" doesn't mean fixed, elsewhere too.**
  - NYC: ~51% of heat complaints were closed after a phone call with no inspection (NYC Comptroller).
  - NYC: 58% of 30K no-heat complaints were flagged as duplicates and closed with the "primary" (City Limits, Apr 2026).
  - LA: Council review of requests "marked closed without being completed" (Aug 2025).

### Caveats to respect in the pitch

- Boston is not slow overall. Frame the problem as an **invisible backlog**, **closed-not-fixed**, and **unequal access**, not speed.
- Neighborhood response-time gaps **flip by issue type and between the old and new systems**. Don't claim "poor neighborhoods get slower service" from this data. The robust equity finding is **who reports** (HKS), plus the **phone dependence** in Mattapan and Hyde Park.
- The new-system data is a **phased migration**: it holds 75,851 cases since 2025-08-01, and parking and ISD are still on the legacy system. Compare within a system, not across.

---

## 3. Who we serve

| Persona | Why them | What they need |
|---|---|---|
| **Resident:** older, phone-first, Haitian Creole or Spanish speaker in Mattapan, Hyde Park or Dorchester | Largest measurable access gap (63% phone in Mattapan; thin language coverage) | Talk in their own language, no app or forms; know someone is on it; see proof when it's fixed |
| **311 call taker:** 28 budgeted in FY27 for ~290K calls a year across 90+ departments | The FY27 budget added no new positions; the easiest "yes" for city judges | Instant case-type and owner suggestion; "already reported by 6 neighbors" context; live translation |
| **Neighborhood liaison, councilor staffer, or department supervisor** | They advocate for districts and have no district view today | A "who's waiting in my district" list; closures that didn't hold; reporting gaps |

Scenarios to weave in:
- **Renter reporting a housing-code issue:** fears landlord retaliation, so needs anonymous-but-verified filing.
- **Wheelchair user:** sidewalk repair is on time only 17.7% of the time; curb-ramp backlog.
- **Encampment and needle reports:** report conditions, not people; route to health teams.

---

## 4. What 311 connects to (the plumbing)

```
CHANNELS              INTAKE                     CASE SYSTEM (CRM)                 WORK SYSTEMS              BACK TO RESIDENT
phone 311 (24/7) ─┐   Connected Bits "Spot"      Creatio (new, "BCS-" IDs)        Cartegraph work orders    closure reason + comment
BOS:311 app ──────┼─► (app + web + Open311 v2) ─► migrating dept by dept;     ─►  (PWD, Parks, BTD signs)   → app / Open311
311.boston.gov ───┤                              Lagan (2008, legacy):             ISD/BTD parking/BWSC:      status_notes
City Worker app ──┘   46% of cases are           ISD, parking, others              systems unknown           (no SMS/email push)
                      employee-created           "INFO_" queues → email to DCR / MassDOT / MBTA / Massport / Eversource (no status back)
```

Migration status: Animal Control, Street Lighting, Forestry, Parks, Highways, Sharps and Signs are on the new system. Parking, ISD, Property Inspection and others are still legacy (fall 2026). The project page targets end of 2026.

**Non-city owners. Today these cases get a closure and a phone number, not a handoff:**

| Owner | Owns | 2025 referrals | How residents reach them |
|---|---|---|---|
| DCR (state) | Parkways: Storrow, Jamaicaway, Day Blvd, Arborway, parts of Morrissey | 2,652 | Email or phone; no API |
| MassDOT | Interstates, tunnels, state routes | 785 | Form, phone (M–F 9–5); no API |
| MBTA | Stations, bus stops, some shelters | 612 | Web form, 617-222-3200; no API |
| Eversource / National Grid | Poles, wires, utility streetlights / gas | 142 / — | Phone lines |
| Massport | Logan, Conley terminal | 82 | Email |
| BWSC (independent) | Water and sewer | wired into 311 | 617-989-7000 |
| BHA | Public housing | 91 | Work Order Center |
| Neighboring towns | Cambridge, Brookline, Newton, Somerville… | closed with "contact the other town" | Each has its own system |

**Demo fact (✅ verified):** in the MassDOT 2025 Road Inventory, **Morrissey Boulevard has three different owners by segment**: DCR (9 segments), MassDOT (4), and a state college (1, UMass Boston). Storrow Drive and the Jamaicaway are each split between DCR and MassDOT. No resident can be expected to know that.

**Statewide:** there are 351 municipalities and no router. Commonwealth Connect (2013, SeeClickFix) lapsed. Brookline runs the same Spot/Open311 platform as Boston, Cambridge uses SeeClickFix (Open311 with an `agency_responsible` field), and Somerville uses Qscend.

---

## 5. Data and APIs you can use today

| Source | What you get | Auth | Notes |
|---|---|---|---|
| **Boston Open311 read**: `https://311.boston.gov/open311/v2/requests.json` | Live cases within ~2 min, **with description text and photo URLs** ✅ (74% and 58% in my 100-row sample), status_notes, lat/long | None (10 req/min without a key) | Use `start_date`/`end_date` windows; paging is inconsistent. CORS is open. Docs: `boston2-production.spotmobile.net/open311/docs`. **Cache a snapshot at the start.** |
| **Boston Open311 write** | Submit a case | `api_key` (request form: `boston2-production.spotmobile.net/open311/app_requests/new`) | **Never POST to production; these are real city cases.** Mock it. |
| **CKAN, new system**: resource `254adca6-64ab-4c5c-9fc0-a6da622be185` | 75,851 cases ✅, 29 fields: case_topic, assigned_department/team, case_status, closure_reason, closure_comments, open/close/target dates, on_time, report_source (BOS311/Call), lat/long, neighborhood, ward, districts | None | SQL: `https://data.boston.gov/api/3/action/datastore_search_sql`. `extract()` and `substr()` are blocked; use `date_part('epoch',…)`, `CASE`, `percentile_cont`. Photos are 0% filled; use Open311 for photos. |
| **CKAN, legacy**: 2026 `1a0b420d-99f1-4887-9851-990b2a5a6e17`, 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`, 2024 `dff4d804-5031-443a-8409-8344efd0e5c8` | ~300K cases a year; `source` channel; closure_reason with an embedded code (Resolved/Noted/Invalid/Duplicate) | None | Regex the closure_reason |
| **MassDOT Road Inventory 2025, road ownership**: `https://services1.arcgis.com/ceiitspzDAHrdGO1/ArcGIS/rest/services/17c_support/FeatureServer/0/query` | `Jurisdictn` per road segment: 0 unaccepted, 1 MassDOT, 2 City/Town, 3 DCR, 5 Massport, B state college, H private; `City`=35 is Boston | None ✅ | Point query: `geometry=lon,lat&geometryType=esriGeometryPoint&inSR=4326&distance=20&units=esriSRUnit_Meter&outFields=St_Name,Jurisdictn,City&f=json`. Centerlines only, so snap with a buffer. |
| **MassGIS environmental justice block groups** | Block groups flagged for income, race or language | None | Organizer-provided link; use as an equity overlay |
| **Boston OpenContext** (City of Boston MCP server) | CKAN tools (`search_datasets`, `query_data`, `execute_sql`…), read-only | Run locally, no key | `cp config-example.yaml config.yaml`, enable the ckan plugin, `python3 scripts/local_server.py` → `http://localhost:8000/mcp`. Boston's hosted one (`data-mcp.boston.gov`) needs OAuth. |
| **Neighbors** | Brookline Open311 (same Spot API); Cambridge SeeClickFix Open311 `seeclickfix.com/open311/v2/requests.json?lat=..&long=..`; Somerville Socrata `4pyi-uqq6` | None for reads | For the "works beyond Boston" story |
| **MBTA stops**: `api-v3.mbta.com/stops?filter[latitude]=..` | Nearby stops | None | No ownership field |

Precomputed analysis tables are in [`research/data/`](data/): closure breakdowns, repeat rates by type, on-time by topic and neighborhood, monthly volume, and the SLA target per topic. Use them for the ETA model and the pitch slides. **They are research outputs, not app code; regenerate whatever the app needs inside Kiro.**

---

## 6. Landscape: what not to build

**Saturated, so avoid as the headline:**
- AI chat or voice that answers 311 questions: Citibot, Polimorphic ($18.6M Series A), Granicus, Salesforce Agentforce.
- Boston's own Creatio rollout already advertises AI.
- "Agent on Boston's MCP server for 311" was the theme of the Boston 311 Hack (2026-04-16, 225 registrants).

**White space (verified gaps):**
1. **Problem-level ledger:** many reports become one problem with a "people waiting" count. Vendors still close duplicates.
2. **Verified closure:** "closed – verified", "closed – disputed", "closed – noted, no work". Nobody tracks closures that didn't hold.
3. **Who's-waiting triage:** ranks by people waiting × days overdue × hazard, adjusted for areas that under-report.
4. **Jurisdiction routing beyond the city:** FixMyStreet does this in the UK; there is no US equivalent.
5. **A resident-side agent with delegated, auditable filing.** The MA civic-agents RFC (Boston CIO Santiago Garcés et al.) describes:
   - a separate agent identity;
   - scoped, expiring delegation;
   - a human confirm step;
   - per-address rate limits;
   - signed receipts;
   - "authenticated but anonymous" 311.

   It lists agent submissions as Phase 2 ("near-term"). Nobody has shipped it.

**Cautionary tales:**
- **NYC MyCity** told businesses to break the law and was killed in 2026. So: the agent files and tracks, and never gives legal advice.
- **Denver** cut live 311 hours and pushed callers to a bot. So: augment humans, don't deflect.
- **The RFC's own threat list** cites a hackathon participant who filed ~100 tickets on one street. So: **mock filing only**.

---

## 7. The concept: think big

> **311 tracks paperwork. We track problems.**
> Every problem gets an owner, a count of who's waiting, and proof it's fixed, in any language, across any jurisdiction.

Working name: *OpenLoop* (placeholder).

**Three layers:**
1. **Resident agent.** Voice, text or photo, in any language. It:
   - works out what and where;
   - finds **who owns it** (city department, DCR, MassDOT, MBTA, utility, neighboring town);
   - checks **if it's already reported** ("6 neighbors reported this 9 days ago; I added you");
   - gives an **honest ETA** from historical data ("Street-light fixes in Mattapan take a median of X days");
   - **files with your consent and a receipt** (civic-agents RFC Level 2: scoped token, confirm step, rate limit, signed receipt);
   - notifies you in your language, then asks **"was it fixed?"**
2. **Problem ledger.** Clusters cases into problems. Each problem has an owner, its case IDs, reporter count, age, SLA status, and a closure-verification state. It reads Open311 and CKAN, and writes Open311-shaped requests (mocked).
3. **Who's-waiting console** for call takers, liaisons and supervisors. A queue ranked by people waiting × days overdue × hazard, with a reporting-gap adjustment, an environmental-justice overlay, and flags for "closed as Noted, then re-reported".

**Why the City says yes:** it doesn't replace Creatio. It sits on Open311, the API of the city's own intake vendor. It makes the 28 call takers faster, makes CityScore honest, and is a working preview of the civic-agents RFC's Phase 2.

**How it scales:**
- **Statewide:** Open311 plus the statewide MassDOT ownership layer give the same router for all 351 MA municipalities and the state agencies.
- **Agent-ready:** expose the ledger as an MCP server, so any assistant (Claude, ChatGPT, Siri) can file and track 311 problems under the RFC's rules.

---

## 8. Six-hour build plan

### Scope

- **Must (the demo path):**
  - snapshot of the last ~30 days of Open311 cases;
  - clustering into problems;
  - resident chat intake with Claude (multilingual);
  - "already reported, +1" against real open problems;
  - an honest ETA from real medians by type and neighborhood;
  - mock filing with consent and a receipt;
  - a problem page with timeline and photo;
  - who's-waiting list and map.
- **Should:**
  - the jurisdiction router (MassDOT layer, plus a Boston-boundary check, plus an owner directory);
  - voice input (Web Speech API);
  - the environmental-justice overlay;
  - a "was it fixed?" verification button;
  - a small MCP server exposing `find_problem`, `file_report` (mock) and `get_status`.
- **Won't:** real 311 submissions, real SMS, auth, native apps, replacing any city system.

### Stack (suggested)

| Layer | Choice |
|---|---|
| Front end | TypeScript, React (Vite), MapLibre or Leaflet with OSM tiles |
| API | Node (Hono or Express); SQLite or plain JSON for the snapshot |
| LLM | Claude on **Amazon Bedrock** (AWS is a sponsor), using tool calls: `classify`, `geocode`, `find_owner`, `find_nearby_problem`, `estimate_eta`, `file_report_mock` |
| Tests | Vitest plus **fast-check** for property-based tests |
| Deploy | Amplify or Vercel; judges need a live link |

### Data contract (agree on this in the first 30 minutes)

```ts
type Problem = {
  id: string; serviceType: string; lat: number; lon: number;
  owner: { kind: "city_dept" | "state_agency" | "utility" | "other_town" | "private"; name: string; howToReach: string };
  caseIds: string[]; reporters: number;
  firstReportedAt: string; lastReportedAt: string;
  status: "open" | "closed";
  slaTargetAt?: string; overdueHours?: number;
  closure?: { reason: string; comment?: string; verified: "unverified" | "fixed" | "disputed" | "noted_no_work" };
  neighborhood: string; ejBlockGroup?: boolean;
};
```

### Team split (each person owns one spec and one Kiro surface)

| Person | Owns | Kiro surface |
|---|---|---|
| P1 | **Ledger and data**: Open311 snapshot, clustering, ETA table, who's-waiting score | IDE; spec `problem-ledger`; PBT |
| P2 | **Resident agent**: chat UI, voice, Bedrock tool loop, multilingual replies, mock filing with receipt | IDE; spec `resident-intake` |
| P3 | **Router and console**: MassDOT ownership query, owner directory, console map and list | CLI V3; spec `jurisdiction-router`; custom agent |
| P4 | **Kiro showcase, integration and pitch**: steering, hooks, OpenContext MCP, custom power, `KIRO_LOG.md`, deploy, video, write-up | IDE hooks, steering and MCP; Web if you have a paid plan |

### Timeline

| Time | What |
|---|---|
| 0:00–0:30 | Repo plus `.kiro/` steering; generate the 3 specs in Kiro; agree the `Problem` contract; P1 caches the Open311 snapshot |
| 0:30–3:00 | Parallel build |
| **3:00** | **Integration checkpoint:** the end-to-end demo path works on real data. If not, cut "Should" items now. |
| 3:00–4:30 | Polish the demo path; add router, EJ overlay and verify-fix if on track |
| 4:30–5:15 | Feature freeze, deploy, record the video |
| 5:15–6:00 | Kiro write-up, README, submission, buffer |

### Three-minute demo script

1. **Hook (20s):**
   - In Boston, 3 in 10 closed 311 cases are just "Noted".
   - About 1 in 5 reports repeats one someone already filed.
   - Potholes get fixed on time 30% of the time.
   - Then: "311 tracks paperwork. We track problems."
2. **Resident (60s):** Marie, Mattapan, speaks Haitian Creole about a dark streetlight. The agent says 6 neighbors already reported it 9 days ago, that it's overdue, and that the typical fix takes X days. She is added as person #7 and gets a receipt in Haitian Creole.
3. **Routing (30s):** a pothole on Morrissey Blvd. "This block belongs to DCR, not the City. Here's who owns it, and we've prepared the report for them." Show the three-owner map.
4. **City console (40s):** who's waiting. Marie's streetlight jumps the queue (7 people waiting, overdue, low-reporting area). Then a cluster that was closed "Noted" and re-reported 3 times.
5. **Kiro (30s):** the specs, a property-based test catching a clustering bug, the hooks, the City's own MCP server.

---

## 9. Kiro plan (a third of the score)

The rules: `.kiro/` at the repo root and not gitignored; insufficient Kiro use means disqualification; the write-up must cover each feature.

| Feature | What to do |
|---|---|
| **Specs** (`.kiro/specs/<name>/requirements.md, design.md, tasks.md`, EARS notation) | Write 3: `problem-ledger` (Design-First), `resident-intake` (Requirements-First), `jurisdiction-router`. Add one Bugfix spec if a real bug appears. |
| **Property-based tests** (IDE only; pin fast-check in `tech.md`) | These properties:<br>• every case belongs to exactly one problem;<br>• clustering is order-independent and idempotent;<br>• every problem has exactly one owner;<br>• the public view never contains PII;<br>• status never flips closed→open without a new report;<br>• every locale has the same keys. |
| **Hooks** (`.kiro/hooks/*.json`) | • `PostFileSave` on `src/ledger/**` runs the property-based suite;<br>• on `locales/en/**`, enforce key parity across locales;<br>• on resident copy, a plain-language (grade-8) check;<br>• `Stop` runs typecheck and tests.<br>Break something on purpose and show the hook catch it. |
| **Steering** (`.kiro/steering/*.md`) | `product.md` and `tech.md` (always); `civic-plain-language-a11y.md` (fileMatch on `**/*.tsx` and `locales/**`; WCAG 2.2 AA, grade 8); `privacy-data.md` (no PII in logs or public views; never POST to real 311). |
| **MCP** (`.kiro/settings/mcp.json`) | City of Boston **OpenContext** run locally (CKAN plugin on data.boston.gov), so Kiro queries real 311 schemas while building. Also `mcp-server-fetch`, and Playwright for end-to-end checks. |
| **Powers** | Build a repo-local `power-boston-311`: the OpenContext MCP plus a plain-language skill, with keywords `311`, `case`, `resident`. Creating a power scores higher than only using one. |
| **Surfaces** | IDE (P1, P2, P4), CLI V3 `kiro-cli --v3` (P3), Web (paid plans only), Crew (stretch). |
| **Log** | Fill `KIRO_LOG.md` as you go: who, which surface, what, commit hash or screenshot. It becomes the write-up. |

**Rule:** build all app code inside Kiro. The analysis scripts behind this brief live outside the repo; don't paste them in.

---

## 10. Guardrails

- **Never submit to the real 311.** Label the app "demo mode"; the mock endpoint mirrors Open311's POST shape.
- **Ground the agent.** It classifies, routes, files and tracks. It never gives legal or eligibility advice, and it cites the data behind every ETA.
- **Privacy.** Open311 descriptions and photos can contain personal details, and the organizers' 311 kit deliberately drops street addresses. In public views, show sensitive types (housing, encampments, needles) at block level, and never show faces or plates.
- **Equity language.** Say "reporting gaps" and "phone-dependent neighborhoods". Don't say "poor neighborhoods get slower service".
- **Rate limits.** Open311 allows 10 requests a minute without a key, so snapshot at the start and serve from cache.

---

## 11. Open questions for the team

1. Each person's strengths (front end / data / AI / pitch), to finalize the split.
2. The submission deadline (exact time).
3. Kiro plan tier: does anyone have paid Kiro or event credits? That decides whether Web counts.
4. AWS access: Bedrock credits from the event? Otherwise use the Anthropic API.
5. Ask the organizers whether City of Boston staff can share a sandbox Open311 key or `data-mcp.boston.gov` access.

---

## Key sources

- Boston 311 modernization project: https://boston.gov/departments/boston-digital-service/311-technology-modernization-project
- Boston 311 data (legacy and new system): https://data.boston.gov/dataset/311-service-requests
- Boston Open311 docs: https://boston2-production.spotmobile.net/open311/docs
- HKS brief on Boston 311 equity (2025): https://www.hks.harvard.edu/sites/default/files/2026-02/Maya%20PAE%20Brief.pdf
- MA civic-agents RFC: https://civicagents.projectnanda.org/rfc/agents4ma
- Boston agents identity and auth memo: https://github.com/projnanda/civic-agents/blob/main/boston-agents-identity-and-auth.md
- City of Boston OpenContext (MCP): https://github.com/CityOfBoston/OpenContext
- Boston's CIO on open-source agentic tools: https://statescoop.com/bostons-cio-open-source-agentic-ai-tools/
- Creatio rollout (InformationWeek, Feb 2026): https://www.informationweek.com/it-leadership/how-boston-is-transforming-its-outdated-311-system
- Boston 25, jurisdiction blame game: https://www.boston25news.com/news/25-investigates/25-investigates-whos-responsible-bostons-blame-game-leaves-pedestrians-risk/WQCBG2UHBNHTXFLFU7SPXX7W6M
- Boston 25, sidewalk backlog: https://www.boston25news.com/news/local/nothing-is-being-done-boston-backlog-thousands-311-hazardous-sidewalk-complaints-piles-up/7VRY27O63BEHLHZOO2SJH7WCO4
- Buell, Porter & Norton, operational transparency in Boston 311: https://pubsonline.informs.org/doi/10.1287/msom.2020.0877
- NYC Comptroller, "Turn Up the Heat": https://comptroller.nyc.gov/reports/turn-up-the-heat/
- City Limits on NYC duplicate heat complaints: https://citylimits.org/?p=22457260
- NYC MyCity shutdown (The Markup): https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law
- Boston 311 Hack (Apr 2026): https://luma.com/o6dit7xg
- Kiro docs: https://kiro.dev/docs/ (specs, hooks, steering, mcp, powers, cli/v3, web)
