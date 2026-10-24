// PreToolUse hook: block any tool call whose input contains a literal secret.
// Kiro sends {tool_name, tool_input, ...} as JSON on stdin. Exit 2 blocks the
// call and shows stderr to the agent; exit 0 lets it through.
import { readFileSync } from "node:fs";

const PATTERNS = [
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Stripe live key", /\b[rs]k_live_[0-9A-Za-z]{20,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

let input;
try {
  input = JSON.stringify(JSON.parse(readFileSync(0, "utf8")).tool_input ?? "");
} catch {
  process.exit(0); // never block because of a malformed payload
}

const hit = PATTERNS.find(([, re]) => re.test(input));
if (hit) {
  console.error(
    `Blocked: this tool call contains what looks like a secret (${hit[0]}). The repo is public. ` +
      "Ask the user to put the value in .env themselves, read it from process.env, " +
      "and list only the variable name in .env.example."
  );
  process.exit(2);
}
