# Yao (2022) thesis: notes and what it changes

**Source:** William Y. Yao, *City Services for a Smarter Boston: Constituent Driven Intelligence through BOS:311*. Harvard A.B. thesis in Applied Math, May 2022 (advisor: Sheila Jasanoff). Harvard DASH: https://nrs.harvard.edu/URN-3:HUL.INSTREPOS:37372690. The PDF is kept locally only (it isn't ours to publish); get it from the DASH link.

**Method:**
- Interviews with the 311 Director, the 311 Operations Manager, Neighborhood Liaisons, and an Age Strong Commission project manager.
- Time-series and spatial analysis of 2016–2019 311 data.
- Negative binomial regression of census-tract request counts on demographics.

**Verdict: no pivot.** The thesis's insider interviews independently confirm the core of our build: duplicates, missing information, closure, and jurisdiction. Its regression table, read correctly, supports a reporting gap that looks linguistic. That changes where the gap correction sits in our priority formula and how we describe it in the pitch.

---

## 1. What insiders told the author (Chapter 2). This is our strongest evidence.

| Finding (PDF page) | Detail | What it means for us |
|---|---|---|
| **Duplicates are closed, not counted** (p.46) | A former Neighborhood Liaison (now Age Strong PM) describes neighbors at a community meeting all reporting the same issue to raise its priority. It "does not render the request higher priority," and the City is likely to "close out all but one of the cases without explanation," which frustrates residents. | The problem ledger exactly. A re-report on an open problem is a **+1 to people waiting**, never a closure. |
| **Residents resubmit as reminders** (p.46) | Individuals file repeat requests to nudge the City. Her suggestion: a "remind / ping for an update" feature. | A re-report on an open problem counts as a reminder: it bumps the problem's age and people-waiting score. Show reporters "you're 1 of 7 waiting." |
| **Not enough information to route** (pp.47–48) | Example: "a contractor left a mess." A private contractor means ISD; a public one means PWD. 311 either sends a PWD staffer to find out or closes the case. "Neither… is an effective use of resources." | Validates complete work packets plus `NEEDS_INFO`. New: the router should return **ambiguous plus the one deciding question**, not guess. |
| **Reporters often leave no contact info** (p.47) | Privacy-averse residents can't be reached for follow-up. | **Problem-level reachability:** send `NEEDS_INFO` and `NOT_FOUND` requests to *every* reporter on the problem. With 7 reporters, someone is likely reachable. |
| **311 staff close cases by hand** (p.46) | "The 311 Office tracks all open cases and manually closes them out upon resolution." (2022, legacy system) | Supports moving a structured outcome to the entity that did the work. (Our inference: the person closing isn't the person who fixed it, which helps explain the "Noted" closures.) |
| **Departments open their own cases** (pp.45–46) | BTD, BFD and PWD can create cases directly. Employee-generated cases are about 46% of volume today. | The ledger must accept `source: employee` reports and cluster them with resident reports. |
| **Cross-jurisdiction misdirection** (pp.41, 50) | Revere and Chelsea calls land at Boston 311; state matters get redirected to Mass 211. | Validates the router's "other town / state agency" path. |
| **Neighborhood Liaisons are the feedback channel** (pp.43–45) | Liaisons are mayoral appointees per neighborhood and per community (Haitian, Cape Verdean, Vietnamese, Hispanic). They staff 311 during crises. | A neighborhood-filtered ops view works as a liaison view. |
| **Older residents prefer phone and people** (pp.50–51) | The phone line is preferred by older constituents. | The phone-share gap (Hyde Park, West Roxbury, Mattapan) reads as **age**, not only income. |
| **The CIO's question** (p.105) | Boston's CIO asked a vendor: "What is the system going to tell me?" The vendor couldn't answer. | **Answer it in the pitch:** "Which problems have the most people waiting the longest, who really owns each one, and what actually happened to it." |

---

## 2. Quantitative findings (Chapters 3–4), with a correction

**Volume is predictable.**
- Tract-level 311 volume is predictable from community characteristics alone: random forest R² ≈ **0.82** for both 2017 and 2019.
- Adding last year's counts raises it to **0.95**.
- Requests cluster in space (Moran's I ≈ 0.10–0.13, p < 0.05).
- So raw volume mostly reflects **who and how many people live there**, not where problems are.

**Who reports less.** This is a negative binomial regression on 2016–2019 tracts, controlling for population, housing units, income, education, age and spatial lag.

| Variable | Coefficient (per percentage point) | Consistent across years? | Correct reading (log link) |
|---|---|---|---|
| % Hispanic/Latino | −0.012 to −0.016 | Negative all 4 years, mostly significant | ≈ **22% fewer requests per 1 SD** (15.9pp) in 2019 |
| % Asian | −0.008 to −0.018 | Negative all 4 years, significant in some | ≈ **14% fewer per 1 SD** (9.2pp) in 2019 |
| % Black | ≈ 0 | Not significant | No effect |
| Median income (log) | ≈ 0.07–0.14 on total requests | Not significant | No income effect on total volume |
| Median income (log) | ≈ 0.21–0.37 on hotline requests | Significant in 2019 | Higher-income tracts phone more; the author suggests older residents |

**The correction.**
- The thesis concludes "no cause for overwhelming concern," reading −0.0164 as "about 1 less request" a year per percentage point.
- Under the model's log link, it is actually **≈1.6% fewer per percentage point**: about 20 fewer requests at the 2019 mean tract of 1,247 requests a year.
- The author's own hypothesis is a **Spanish and Mandarin language barrier**, which this pattern fits.
- Caveats: one undergraduate study, about 180 tracts, ecological inference, and pre-2020 data.

**How it fits with the other evidence.**
- The HKS 2025 brief (2023 data) found white share positive, which agrees with Yao, and income positive, which disagrees with Yao on total volume.
- Our language-access findings point the same way: boston.gov has 6 languages, about 2% of calls used an interpreter in 2025, and the app had no Spanish until 2022.
- **Net: the reporting gap is real, and its clearest signal is language.** Income effects are mixed across studies.

---

## 3. What we change in the build

1. **The gap correction moves onto the people-waiting term only.** Counting duplicates as "people waiting" is the right thing to do (§1, row 1). By itself, though, it **amplifies** reporting gaps: a block that reports less gets fewer reporters per problem. So the correction scales the reporter count, not hazard or lateness:
   `people = 1 + log2(reporterCount × gap)`.
   If the gap turns out small (Yao's reading), the correction is small. If it's moderate (the HKS reading), the correction is moderate. Either way we can defend it.
2. **Never weight by race or ethnicity.** `gap` comes only from the **measured reporting rate** (BARI custodianship per block group). That is neutral, auditable, and legally safer.
3. **A re-report on an open problem is a reminder.** It increments `reporterCount` and refreshes `lastReportedAt`; it never closes anything. Add this as a property-based test.
4. **`NEEDS_INFO` and `NOT_FOUND` go to every reporter on the problem**, not only the first.
5. **The router can answer "ambiguous" plus a deciding question** (e.g. "Was the contractor working for the City or a private building?"). That puts the problem in triage with the question attached. Should-have.
6. **Translated resident messages:** keep them as a Should, but put **one translated status line in the video**. Language is the clearest gap, and outbound messages are the language lever we own.

## 4. Pitch lines this gives us

- "An insider told a Harvard researcher that when neighbors all report the same problem, the City closes all but one 'without explanation.' We turn those reports into a count of who's waiting."
- "Boston's CIO once asked a vendor: 'What is the system going to tell me?' Ours tells you which problems have the most people waiting the longest, who really owns each one, and what actually happened."
- "Across 2016–2019, tracts with more Hispanic and Asian residents filed measurably fewer 311 reports, a pattern consistent with a language barrier. We don't boost anyone by demographics. We correct the people-waiting count by each block's measured reporting rate."

## 5. Out of date (don't quote as current)

| Thesis (2022) | Today |
|---|---|
| "27 employees" | FY27 budget: 28 call takers |
| "~1,200 calls a day" | 2025: ~292K calls, about 800 a day |
| Spanish in the app "coming" | The app now supports 10–12 languages |
| "Moving to a cloud CRM" | That became the Creatio migration, due end of 2026 |
