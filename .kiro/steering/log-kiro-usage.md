---
inclusion: manual
---

# Log Kiro usage

Add one row to the **Log** table in `KIRO_LOG.md` for the Kiro work just done in this session.

- Columns: Time (local HH:MM) | Who (`git config user.name`) | Surface (IDE, CLI, Web or Crew) | Feature (Specs, Hooks, Steering, MCP, PBT, Powers, or other) | What happened | Evidence.
- "What happened" is one sentence about the effect, not the steps: what Kiro did and why it mattered. Example: "PBT found clustering wasn't order-independent; fixed in ledger.ts".
- Evidence is the latest commit hash if the work is committed, otherwise "uncommitted" plus the main file touched. Mention a screenshot only if it exists in `docs/kiro/`.
- If the entry answers a question in the **Coverage plan**, tick that row's Done box and add a sentence to the matching **Write-up drafts** section.
- Don't change any other rows.
