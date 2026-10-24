---
inclusion: always
---

# Hackathon guardrails

Hackachusetts 2026. Judges score Potential Value, Implementation (how well we used Kiro), and Quality and Design. These rules hold whatever we end up building.

## How we work

- All application code is written through Kiro. Insufficient Kiro use is grounds for disqualification.
- `.kiro/` stays in the repo. Never add it, or anything under it, to `.gitignore`.
- When a Kiro feature does something worth showing (a spec, hook, steering effect, MCP call, property-based test), add a row to the Log in `KIRO_LOG.md`.
- Build the demo path first: the flow the 3-minute video shows. Everything else waits until that works end to end on real data.
- The repo is public. Secrets live in `.env` (gitignored) and are read from environment variables. `.env.example` lists the variable names with no values. MCP config references env vars, never literal keys.

## Real-world systems and data

- Never write to a real government, health or public system (311, agency forms, email, SMS, payments). Every write is a mock that mirrors the real API's shape, and the UI says "demo mode".
- Public APIs: fetch a snapshot early, keep it in the repo, and serve from it. Respect rate limits. Show the source and date next to any number in the UI.
- No personal data in logs, fixtures, screenshots or public views. Show sensitive locations at block level or coarser.
- The product informs, routes and tracks. It never makes legal, medical, eligibility or emergency decisions; it points to the agency or professional who does.
- Describe equity findings as patterns in the data (for example "reporting gaps"), never as claims about groups that the data can't support.

## Submission

- All submission materials are in English.
- No third-party trademarks, logos or copyrighted media in the UI or the video without permission.
- The README explains the features, how to run the project, and how judges can test it.
