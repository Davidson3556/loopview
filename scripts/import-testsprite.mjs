#!/usr/bin/env node
/**
 * Imports a completed TestSprite run into LoopView as a real loop session +
 * iterations, so the dashboard/history show genuine TestSprite results.
 *
 * Usage: LOOP_USER_ID=<auth.users id> node scripts/import-testsprite.mjs
 */
import { readFileSync } from "node:fs";

const pj = JSON.parse(readFileSync(".insforge/project.json", "utf8"));
const BASE = pj.oss_host.replace(/\/+$/, "");
const KEY = pj.api_key;
const USER = process.env.LOOP_USER_ID;
if (!USER) {
  console.error("LOOP_USER_ID is required");
  process.exit(1);
}

const H = {
  "content-type": "application/json",
  Authorization: `Bearer ${KEY}`,
  Prefer: "return=representation",
};
const rec = (t) => `${BASE}/api/database/records/${t}`;
async function insert(t, row) {
  const r = await fetch(rec(t), { method: "POST", headers: H, body: JSON.stringify([row]) });
  if (!r.ok) throw new Error(`insert ${t}: ${r.status} ${await r.text()}`);
  return (await r.json())[0];
}
async function patch(t, id, v) {
  const r = await fetch(`${rec(t)}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(v) });
  if (!r.ok) throw new Error(`patch ${t}: ${r.status} ${await r.text()}`);
}

// Real results from the TestSprite run (10 passed / 15).
const RESULTS = [
  { id: "TC001", name: "Create a new account and reach the dashboard", result: "fail", file: "src/app/auth/page.tsx",
    cli: "$ testsprite run TC001\n✗ BLOCKED: 'Sign up' did not switch the form to sign-up mode\n  /signup, /auth/signup, /login → 404",
    root: "Automated agent could not reach a sign-up form: the visible 'Sign up' control did not switch modes and conventional signup routes 404.",
    ai: "Add a distinct, testable sign-up affordance (e.g. a role=button with an accessible name and a data-testid), and consider redirecting /signup and /login to /auth so convention-based navigation resolves." },
  { id: "TC002", name: "Sign in and reach the dashboard", result: "pass",
    cli: "$ testsprite run TC002\n✓ signed in and redirected to /dashboard\nPASS" },
  { id: "TC003", name: "Start a session from the dashboard", result: "fail",
    cli: "$ testsprite run TC003\n✗ BLOCKED: signed-in flow unreachable (/login 404, dashboard stuck on spinner)",
    root: "The sign-in entry point the agent expected was unreachable, so the start-session flow could not be exercised." },
  { id: "TC004", name: "Inspect the live dashboard overview", result: "pass",
    cli: "$ testsprite run TC004\n✓ Write/Verify/Result panels present\nPASS" },
  { id: "TC005", name: "End an active session from the dashboard", result: "pass",
    cli: "$ testsprite run TC005\n✓ session ended, status updated\nPASS" },
  { id: "TC006", name: "Review live loop progress updates", result: "fail",
    cli: "$ testsprite run TC006\n✗ timeout: timeline element never appeared (10000ms)",
    root: "On the unauthenticated demo dashboard there is no live streaming session, so the agent's wait for live timeline updates timed out.",
    ai: "Live streaming requires an active session; on the demo/logged-out view, label the timeline as static demo data or gate the streaming assertion behind an authenticated session." },
  { id: "TC007", name: "Simulate a new iteration during an active session", result: "fail",
    cli: "$ testsprite run TC007\n✗ BLOCKED: /login → 404, no sign-in form reachable",
    root: "Sign-in route unreachable at the conventional path, blocking session + iteration actions." },
  { id: "TC008", name: "See the unauthenticated dashboard demo state", result: "pass",
    cli: "$ testsprite run TC008\n✓ demo banner + demo loop visible when signed out\nPASS" },
  { id: "TC009", name: "Analyze a failed iteration for a fix suggestion", result: "fail",
    cli: "$ testsprite run TC009\n✗ BLOCKED: login unreachable, dashboard flow not accessible",
    root: "Could not reach the signed-in dashboard to trigger AI failure analysis." },
  { id: "TC010", name: "Inspect a timeline iteration", result: "pass",
    cli: "$ testsprite run TC010\n✓ clicking a timeline block shows that iteration\nPASS" },
  { id: "TC011", name: "Start a fresh session after ending the previous one", result: "pass",
    cli: "$ testsprite run TC011\n✓ new session starts cleanly\nPASS" },
  { id: "TC012", name: "Inspect a specific iteration from the timeline", result: "pass",
    cli: "$ testsprite run TC012\n✓ specific iteration renders in panels\nPASS" },
  { id: "TC013", name: "Analyze a failed iteration with AI suggestions", result: "pass",
    cli: "$ testsprite run TC013\n✓ AI fix assistant returns a suggestion\nPASS" },
  { id: "TC014", name: "View past sessions in history", result: "pass",
    cli: "$ testsprite run TC014\n✓ history lists past sessions\nPASS" },
  { id: "TC015", name: "Verify the dashboard summary tiles", result: "pass",
    cli: "$ testsprite run TC015\n✓ total/passed/pass-rate/elapsed tiles correct\nPASS" },
];

const session = await insert("loop_sessions", {
  user_id: USER,
  project_id: "loopview",
  app_url: "http://localhost:3000",
  status: "active",
});
console.log("session", session.id);

let n = 0;
for (const t of RESULTS) {
  n++;
  await insert("loop_iterations", {
    session_id: session.id,
    iteration_number: n,
    test_id: t.id,
    test_name: t.name,
    file_changed: t.file ?? null,
    cli_output: t.cli,
    result: t.result,
    root_cause: t.root ?? null,
    ai_suggestion: t.ai ? JSON.stringify({ explanation: t.ai, file: t.file ?? null, line: null, fix_snippet: null, root_cause: t.root ?? "" }) : null,
    agent_name: "TestSprite",
  });
  process.stdout.write(`  ${t.id} ${t.result === "pass" ? "✓" : "✗"}\n`);
}

const passed = RESULTS.filter((r) => r.result === "pass").length;
await patch("loop_sessions", session.id, {
  status: "completed",
  ended_at: new Date().toISOString(),
  total_loops: RESULTS.length,
  passed_loops: passed,
});

console.log(`\n✔ Imported ${RESULTS.length} iterations (${passed} passed).`);
console.log(`View: https://loopview.vercel.app/session/${session.id}`);
