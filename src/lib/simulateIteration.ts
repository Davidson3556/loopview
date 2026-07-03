import { insertIteration, updateIteration, refreshSessionCounts } from "./loops";
import type { LoopIteration } from "./types";

/**
 * Simulates one loop iteration end-to-end so the dashboard's realtime path can
 * be exercised before the real TestSprite runner lands (Day 3):
 *   1. insert a `pending` row  → panels show the spinner
 *   2. ~1.6s later resolve it   → panels flip to pass/fail
 * Both writes fire the realtime trigger, driving live updates.
 */

type Scenario = Pick<
  LoopIteration,
  | "test_id"
  | "test_name"
  | "file_changed"
  | "code_diff"
  | "agent_name"
> & {
  outcome: "pass" | "fail";
  cli_running: string;
  cli_done: string;
  root_cause?: string;
  ai_suggestion?: string;
  fix_applied?: string;
  duration_ms: number;
};

const SCENARIOS: Scenario[] = [
  {
    test_id: "TS-2001",
    test_name: "Landing page renders hero CTA",
    file_changed: "src/app/page.tsx",
    code_diff: `@@ -30,3 +30,3 @@\n-        <Link href=\"/login\">\n+        <Link href=\"/auth\" className=\"bg-brand\">\n           Get started`,
    agent_name: "Claude",
    outcome: "fail",
    cli_running: "$ testsprite test run --id TS-2001\n› launching browser…\n› navigating to app URL",
    cli_done:
      "$ testsprite test run --id TS-2001\n› launching browser…\n✗ expected [data-cta] to be visible\n  received: element not found",
    root_cause:
      "The CTA link lost its data-cta attribute during the refactor, so the assertion can't find it.",
    ai_suggestion:
      "Re-add data-cta to the primary Link, or update the test selector to target the button by role/name.",
    duration_ms: 4100,
  },
  {
    test_id: "TS-2001",
    test_name: "Landing page renders hero CTA",
    file_changed: "src/app/page.tsx",
    code_diff: `@@ -30,3 +30,3 @@\n-        <Link href=\"/auth\" className=\"bg-brand\">\n+        <Link href=\"/auth\" data-cta className=\"bg-brand\">\n           Get started`,
    agent_name: "Claude",
    outcome: "pass",
    cli_running: "$ testsprite test run --id TS-2001\n› launching browser…\n› navigating to app URL",
    cli_done:
      "$ testsprite test run --id TS-2001\n› launching browser…\n✓ [data-cta] visible\n✓ navigates to /auth on click\nPASS (2 assertions) in 3.6s",
    fix_applied: "Added data-cta back to the hero CTA link.",
    duration_ms: 3600,
  },
  {
    test_id: "TS-2044",
    test_name: "Settings persists TestSprite project id",
    file_changed: "src/app/settings/page.tsx",
    code_diff: `@@ -52,0 +53,3 @@\n+      const { error } = existing\n+        ? await db.update(payload).eq('user_id', user.id)\n+        : await db.insert([{ user_id: user.id, ...payload }])`,
    agent_name: "Claude",
    outcome: "pass",
    cli_running: "$ testsprite test run --id TS-2044\n› filling settings form…",
    cli_done:
      "$ testsprite test run --id TS-2044\n› filling settings form…\n✓ value persists across reload\nPASS (1 assertion) in 5.2s",
    fix_applied: "Upsert via select-then-update/insert (SDK has no upsert).",
    duration_ms: 5200,
  },
];

export async function simulateIteration(
  sessionId: string,
  iterationNumber: number,
): Promise<{ error: string | null }> {
  const scenario = SCENARIOS[(iterationNumber - 1) % SCENARIOS.length];

  // 1. pending
  const { iteration, error } = await insertIteration({
    session_id: sessionId,
    iteration_number: iterationNumber,
    test_id: scenario.test_id,
    test_name: scenario.test_name,
    file_changed: scenario.file_changed,
    code_diff: scenario.code_diff,
    agent_name: scenario.agent_name,
    cli_output: scenario.cli_running,
    result: "pending",
  });
  if (error || !iteration) return { error: error ?? "failed to insert" };

  // 2. resolve after a short delay
  await new Promise((r) => setTimeout(r, 1600));
  const { error: upErr } = await updateIteration(iteration.id, {
    result: scenario.outcome,
    cli_output: scenario.cli_done,
    duration_ms: scenario.duration_ms,
    root_cause: scenario.root_cause ?? null,
    // Left null on purpose: the Result panel's "Analyze failure" button asks the
    // InsForge Model Gateway (Claude Sonnet) to produce the real suggestion.
    ai_suggestion: null,
    fix_applied: scenario.fix_applied ?? null,
  });
  if (upErr) return { error: upErr };

  await refreshSessionCounts(sessionId);
  return { error: null };
}
