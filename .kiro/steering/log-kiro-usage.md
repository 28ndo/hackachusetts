---
inclusion: manual
---

# Log Kiro usage

Add one row for the Kiro work just done in this session to **your own** log file: `docs/kiro-log/<slug>.md`, where `<slug>` is `git config user.name` in lowercase with spaces as hyphens. If the file doesn't exist, create it with a `# Kiro log: <name>` heading and the table header below. Never edit `KIRO_LOG.md` or another person's file: three people push to this repo, and one shared file causes merge conflicts. The team compiles everything into `KIRO_LOG.md` at the end.

- Columns: Time (local HH:MM) | Who (`git config user.name`) | Surface (IDE, CLI, Web or Crew) | Feature (Specs, Hooks, Steering, MCP, PBT, Powers, or other) | What happened | Evidence.
- "What happened" is one sentence about the effect, not the steps: what Kiro did and why it mattered. Example: "PBT found clustering wasn't order-independent; fixed in ledger.ts".
- Evidence is the latest commit hash if the work is committed, otherwise "uncommitted" plus the main file touched. Mention a screenshot only if it exists in `docs/kiro/`.
- If the entry answers a question in the **Coverage plan** of `KIRO_LOG.md`, add a line under the table in your file: `Covers: <feature row>` plus one sentence for that feature's write-up.
- Don't change any other rows.
