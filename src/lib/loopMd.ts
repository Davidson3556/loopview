import type { LoopSession, LoopIteration } from "./types";
import { parseAiSuggestion } from "./aiFix";

/**
 * Generates a submission-ready LOOP.md from stored sessions + iterations,
 * following the hackathon's expected format:
 *
 *   ## Loop N — <test name>
 *   Date: ...
 *   What I built: ...
 *   Test created: ...
 *   Result: FAILED
 *   Root cause: ...
 *   Fix: ...
 *   Rerun result: PASSED ✅
 */
export function generateLoopMd(
  sessions: LoopSession[],
  itersBySession: Record<string, LoopIteration[]>,
): string {
  const lines: string[] = [];
  lines.push("# LoopView — Loop Log", "");
  lines.push(
    "_Auto-generated from InsForge loop sessions. Each entry is one write → verify → fix → verify iteration._",
    "",
  );

  let loopNo = 0;

  for (const session of sessions) {
    const iters = (itersBySession[session.id] ?? []).slice().sort(
      (a, b) => a.iteration_number - b.iteration_number,
    );
    if (iters.length === 0) continue;

    const passed = iters.filter((i) => i.result === "pass").length;
    const rate = iters.length ? Math.round((passed / iters.length) * 100) : 0;
    lines.push(
      `## Session — ${session.app_url}`,
      `Started: ${fmt(session.started_at)} · ${iters.length} loops · ${rate}% pass rate`,
      "",
    );

    for (const it of iters) {
      loopNo++;
      const fix = resolveFix(it, iters);
      const rerun = resolveRerun(it, iters);

      lines.push(`### Loop ${loopNo} — ${it.test_name ?? "Untitled test"}`);
      lines.push(`Date: ${fmt(it.created_at)}`);
      lines.push(`What I built: ${it.file_changed ?? "—"}`);
      if (it.test_id) lines.push(`Test created: ${it.test_id}`);
      lines.push(`Result: ${resultWord(it.result)}`);
      if (it.root_cause) lines.push(`Root cause: ${it.root_cause}`);
      if (fix) lines.push(`Fix: ${fix}`);
      if (rerun) lines.push(`Rerun result: ${rerun}`);
      lines.push("");
    }
  }

  if (loopNo === 0) {
    lines.push("_No loop iterations recorded yet._", "");
  }

  return lines.join("\n");
}

function resultWord(r: LoopIteration["result"]): string {
  if (r === "pass") return "PASSED ✅";
  if (r === "fail") return "FAILED ❌";
  return "PENDING…";
}

/** Prefer an explicit fix_applied; otherwise fall back to the AI suggestion. */
function resolveFix(it: LoopIteration, all: LoopIteration[]): string | null {
  if (it.fix_applied) return it.fix_applied;
  const ai = parseAiSuggestion(it.ai_suggestion);
  if (ai?.explanation) return ai.explanation;
  if (it.ai_suggestion) return it.ai_suggestion;
  // Look ahead: the next same-test iteration's diff is effectively the fix.
  const next = all.find(
    (o) =>
      o.iteration_number > it.iteration_number &&
      o.test_id === it.test_id &&
      o.file_changed,
  );
  return next?.fix_applied ?? null;
}

/** If a later iteration of the same test passed, report the rerun outcome. */
function resolveRerun(it: LoopIteration, all: LoopIteration[]): string | null {
  if (it.result !== "fail") return null;
  const later = all.find(
    (o) =>
      o.iteration_number > it.iteration_number &&
      o.test_id === it.test_id &&
      o.result === "pass",
  );
  return later ? "PASSED ✅" : null;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}
