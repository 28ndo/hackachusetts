# Boston Open311 snapshot: real demo data

**20,730 real Boston 311 reports, 2026-09-24 19:00Z to 2026-10-24 18:48Z** (30 days), pulled on 2026-10-24 from the city's public Open311 feed:

```
GET https://311.boston.gov/open311/v2/requests.json?start_date=…&end_date=…&page_size=300&extensions=true
```

Every 3-hour window came back under the 300-row cap, so nothing was truncated. Duplicates across window edges were removed by `service_request_id`.

Load this file in the app instead of calling the live feed. It is immune to the 10-requests-per-minute limit and to outages. **The ingest code itself must still be built in Kiro.**

## Files

| File | What it is |
|---|---|
| `boston-open311-2026-09-24_to_2026-10-24.json` | Array of 20,730 Open311 requests, oldest first |
| `summary.json` | Coverage, status mix, top services, top closure notes |
| `demo-picks.json` | Full records for the demo scenes below |
| `jurisdiction-checked-candidates.json` | 150 pothole, light, sign, tree and signal reports on parkway-type roads, each checked against the MassDOT 2025 Road Inventory owner field. 52 sit on or next to state-owned segments. |
| `demo-candidates.json` | Name-based parkway matches and every spot with 3 or more same-type reports within ~10 m |

## Record shape

```json
{
  "service_request_id": "uuid", "service_name": "Street Light Outage", "service_code": "uuid",
  "status": "open|closed", "status_notes": "Resolved. Request Completed - …",
  "requested_datetime": "2026-10-10T04:11:…Z", "updated_datetime": "…",
  "description": "resident's own words (81% filled)",
  "address": "Mount Vernon St & William T Morrissey Blvd, …", "lat": 42.3…, "long": -71.0…,
  "media_url": "resident photo (69%)",
  "extended_attributes": { "x": "…", "y": "…", "photos": [{ "media_url": "…", "created_at": "…" }] }
}
```

- **Photos:** a photo whose `created_at` is near the closing `updated_datetime` is most likely the crew's closure photo. That's proof-of-fix material. 26% of records have 2 or more photos.
- **Status notes:** `status_notes` (61% filled) is the city's closure text. It sometimes contains raw HTML (`<div>`, `&nbsp;`). Strip it for display, or show it raw as the "before."
- **Status mix:** 12,918 closed, 7,812 open.
- **Volume:** 229–937 reports per day.

## Demo scenes, all real and from this file

| Scene | Record(s) | Why it works |
|---|---|---|
| **Routing: state road** | Street Light Outage, *Mount Vernon St & William T Morrissey Blvd*, open, 3 photos (`da52decb…`) | Road Inventory says **DCR**. Today the report sits open with no note. |
| **Routing: MassDOT** | Street Light Outage, *593 Gallivan Blvd* (`6ca3b0f1…`) | Road Inventory says **MassDOT**. The resident sees "Transitioned. Reallocated to Non-City of Boston Stakeholder." |
| **"Before": what residents see today** | *Boylston St & Fenway* electrical safety (`f5c87a5d…`) | Closure note shown to the resident: `Transitioned. <div><div><div>…dcr advised&nbsp; bcs-00343176</div>…` |
| **"Before": ownership guesswork** | Damaged Sign, *Freeport St & Morrissey Blvd* (`10100675…`) | Closed with "If this is located on the grounds of UMass Boston, the school would be responsible for repair." Road Inventory shows Morrissey segments owned by DCR, MassDOT **and** a state college. |
| **"Before": Noted** | `0e7e303f…` | "Noted. Resubmitted as BCS-00346840, notified Mass DOT." |
| **Many reports, one problem; closure didn't hold** | 9 Traffic Signal reports, *Metropolitan Ave & Poplar St*, Oct 6–7 | Several were closed as "checked, normal" or "Duplicate". One crew found "No power in the CB, is Eversource problem". The fix was a contractor replacing a circuit breaker. **9 cases, 1 problem, and the real owner was the power side.** |
| **Many reports, one problem** | 9 Traffic Signal reports, *Centre St & Green St*, Sep 30 to Oct 9 | Two were closed "Noted. This case was not processed correctly." Signal timing was adjusted, and reports kept coming. |
| **Pothole cluster** | *14 Quincy St*: 8 reports within ~10 m over 2.5 weeks (3 at the exact address) | All closed "Resolved. Violation issued.", so the fix is on a contractor. |
| **Three owners at one spot** | Street Light Outage, *525 VFW Pkwy* (`0e411b27…`) | DCR road; the resident writes the outage was "caused by Eversource work". |

## Rules for using this data

- **Never POST anything back to Open311.** The feed is read-only for us. Filing is simulated.
- **Privacy:** these are real addresses, real photos and residents' own words. In public views:
  - show sensitive types (housing, encampments, needles, animal complaints) at block level;
  - don't feature faces or license plates from photos;
  - don't quote descriptions that identify a person.
- **Photos:** link to the city's image URLs; don't re-host them.
- **Repo size:** the main JSON is about 21 MB, which is fine for GitHub (the limit is 100 MB per file).
- **Accuracy:** the jurisdiction checks use road centerlines with a 20 m buffer. An intersection can touch both a city and a state segment. Treat "mixed" results as "ask the ops queue," which is a good demo moment in itself.
