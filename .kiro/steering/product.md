---
inclusion: always
---

# Product

## Positioning (§1)

> **Every report becomes one problem, with one owner and one honest outcome.**

We are the dispatch and accountability layer 311 is missing. We sit between 311 intake and the departments that do the work: intake (BOS:311 app, phone, later a resident's civic agent) → **us** → city departments, state agencies, utilities → status back to residents through existing channels.

- We turn raw reports into problems, route each to its real owner with a complete work packet, and give every owner a one-tap way to say what they did. Each answer makes routing smarter.
- Don't say "we rebuild the backend." Boston is replacing its CRM now (Creatio). Say "the dispatch and accountability layer," which works with whatever CRM sits underneath.
- Intake is real today and we use it: we ingest the live Boston Open311 feed (real reports, descriptions, photos). "Whatever the front door, reports land here."
- The protocol **replaces the free-text closure comment** entities already write: one tap from a short list, plus an optional note or photo. Same effort, structured output, automatic next step. The 30% "Noted" closures are the pitch hook.

## Users (§2)

| User | We simulate them as | What they get |
|---|---|---|
| **Entity dispatcher / crew lead** (PWD, Street Lighting, DCR, MassDOT…) | Entity inbox with a switcher ("view as DCR") | A ranked queue of work packets: what, where, photos, how many waiting, priority + why, response-by date. One tap to record the outcome. |
| **311 ops / ledger steward** | Ops view | Clusters, routing confidence, stale assignments, closures that didn't hold, entity scorecards |
| **Resident** (receives, doesn't submit) | Resident preview panel in the entity inbox (Must); full status page (Should) | A plain-language outcome instead of "Noted," e.g. "Scheduled for repaving, spring 2027," in their own language. |

Equity shows up in three places, say all three in the video: the priority score (reporting-gap weight), the return path in the resident's language, and the language-isolation and income lenses on the accountability view.

## Core rule (§6)

**No free-text-only closure.** Every outcome code maps to a next step (automatic) and a plain-language resident message. The nine codes: `FIXED`, `MADE_SAFE`, `SCHEDULED`, `DEFERRED_CAPITAL`, `NOT_OURS`, `NOT_FOUND`, `PRIVATE_PROPERTY`, `DUPLICATE`, `NEEDS_INFO`.

## Definition of done: the demo storyboard (§9)

The 3-minute video is the spec. Build only what's on screen.

| Time | Scene |
|---|---|
| 0:00–0:20 | **Hook:** 3 in 10 cases close as "Noted"; 1 in 5 reports repeat; Morrissey Blvd has three owners. |
| 0:20–0:50 | **Firehose → problems:** a day of real reports replays; ~800 reports collapse into N problems. Open a streetlight problem with 6 reports. |
| 0:50–1:30 | **Routing + work packet:** a Morrissey Blvd pothole. Router says "DCR segment (MassDOT Road Inventory)." Lands in the DCR inbox with the full packet and "why #1." |
| 1:30–2:10 | **Entity outcomes:** DCR taps `NOT_OURS → MassDOT`; reroutes and the rule is learned (next report goes straight to MassDOT). Street Lighting taps `FIXED` + photo; resident preview shows the real Chinese-language message, then Haitian Creole. Highway taps `DEFERRED_CAPITAL`; resident sees "spring 2027" not "Noted." |
| 2:10–2:35 | **Accountability:** scorecards, zero "Noted" outcomes, who's waiting, low-reporting weighting. Toggle the language-isolated blocks layer. |
| 2:35–3:00 | **Kiro + scale:** specs, a property-based test catching a clustering bug, hooks, OpenContext MCP. Close: "Any front door lands here. 351 Massachusetts towns, one router." |
