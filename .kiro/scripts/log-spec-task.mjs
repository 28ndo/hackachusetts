// PostTaskExec hook: append a row to the spec task trail at the end of KIRO_LOG.md.
// Kiro sends {spec_name, task_name, task_success, cwd, ...} as JSON on stdin.
import { appendFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

try {
  const p = JSON.parse(readFileSync(0, "utf8"));
  const cwd = p.cwd || process.cwd();
  const git = (args) => {
    try {
      return execSync(`git ${args}`, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    } catch {
      return "";
    }
  };
  const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

  const time = new Date().toTimeString().slice(0, 5);
  const who = git("config user.name") || "?";
  const commit = git("rev-parse --short HEAD") || "no commits yet";
  const dirty = git("status --porcelain") ? " + uncommitted" : "";
  const result = p.task_success === false ? "failed" : "done";

  appendFileSync(
    join(cwd, "KIRO_LOG.md"),
    `| ${time} | ${cell(who)} | ${cell(p.spec_name)} | ${cell(p.task_name)} | ${result} | ${commit}${dirty} |\n`
  );
} catch {
  // Logging must never interrupt the agent.
}
