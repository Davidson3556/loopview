#!/usr/bin/env node
/**
 * LoopView — local TestSprite loop runner.
 *
 * Drives the write → verify → fix → verify loop from your machine and streams
 * every iteration into InsForge, which the deployed dashboard renders live over
 * realtime. On a failure it calls the deployed /api/ai-fix route (Claude Sonnet
 * via the InsForge Model Gateway) and stores the suggestion.
 *
 * Two modes:
 *   --simulate            Write realistic iterations (no TestSprite needed). Great
 *                         for demoing the live dashboard end-to-end today.
 *   (real)                Set TESTSPRITE_RUN_CMD to your TestSprite command and it
 *                         runs once per test, using exit code 0 = pass.
 *
 * Usage:
 *   LOOP_USER_ID=<app-user-uuid> node scripts/loop-runner.mjs --simulate --loops 4
 *   LOOP_USER_ID=<uuid> TESTSPRITE_RUN_CMD='testsprite run --project $TESTSPRITE_PROJECT_ID --test {test}' \
 *     node scripts/loop-runner.mjs --tests scripts/tests.example.json
 *
 * Config (env or .env.local):
 *   INSFORGE_URL / NEXT_PUBLIC_INSFORGE_URL   backend URL (falls back to .insforge/project.json)
 *   INSFORGE_API_KEY                          admin key (falls back to .insforge/project.json api_key)
 *   LOOP_USER_ID                              REQUIRED — the app user to attach the session to
 *   APP_URL                                   app under test (default https://loopview.vercel.app)
 *   AI_FIX_ENDPOINT                           default https://loopview.vercel.app/api/ai-fix
 *   TESTSPRITE_RUN_CMD                        real-mode command; {test} is replaced with the test name
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// ---------------------------------------------------------------------------
// Tiny .env.local loader (no dependency)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

function projectJson() {
  const p = ".insforge/project.json";
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

const pj = projectJson();
const CFG = {
  baseUrl: (
    process.env.INSFORGE_URL ||
    process.env.NEXT_PUBLIC_INSFORGE_URL ||
    pj.oss_host ||
    ""
  ).replace(/\/+$/, ""),
  apiKey: process.env.INSFORGE_API_KEY || pj.api_key || "",
  userId: process.env.LOOP_USER_ID || "",
  appUrl: process.env.APP_URL || "https://loopview.vercel.app",
  projectId: process.env.TESTSPRITE_PROJECT_ID || "loopview",
  aiEndpoint:
    process.env.AI_FIX_ENDPOINT || "https://loopview.vercel.app/api/ai-fix",
  runCmd: process.env.TESTSPRITE_RUN_CMD || "",
};

// ---------------------------------------------------------------------------
// InsForge REST helpers (admin key — bypasses RLS, so we set user_id ourselves)
// ---------------------------------------------------------------------------
function rec(table) {
  return `${CFG.baseUrl}/api/database/records/${table}`;
}
const headers = () => ({
  "content-type": "application/json",
  Authorization: `Bearer ${CFG.apiKey}`,
  Prefer: "return=representation",
});

async function insert(table, row) {
  const res = await fetch(rec(table), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify([row]),
  });
  if (!res.ok) throw new Error(`insert ${table} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function patch(table, id, values) {
  const res = await fetch(`${rec(table)}?id=eq.${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error(`update ${table} failed: ${res.status} ${await res.text()}`);
}

async function aiFix(iteration) {
  try {
    const res = await fetch(CFG.aiEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        test_name: iteration.test_name,
        cli_output: iteration.cli_output,
        code_diff: iteration.code_diff,
        file_changed: iteration.file_changed,
      }),
    });
    const json = await res.json();
    return res.ok ? json.result : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------
async function createSession() {
  const s = await insert("loop_sessions", {
    user_id: CFG.userId,
    project_id: CFG.projectId,
    app_url: CFG.appUrl,
    status: "active",
  });
  log(`▶ session ${s.id} — ${CFG.appUrl}`);
  return s;
}

async function endSession(sessionId, iterations) {
  const passed = iterations.filter((i) => i.result === "pass").length;
  await patch("loop_sessions", sessionId, {
    status: "completed",
    ended_at: new Date().toISOString(),
    total_loops: iterations.length,
    passed_loops: passed,
  });
  log(`■ session complete — ${passed}/${iterations.length} passed`);
}

// One iteration: write pending → verify → resolve → (fix on fail)
async function runIteration(session, n, test) {
  log(`\n─ loop ${n}: ${test.name}`);
  const pending = await insert("loop_iterations", {
    session_id: session.id,
    iteration_number: n,
    test_id: test.id ?? null,
    test_name: test.name,
    file_changed: test.file ?? null,
    code_diff: test.diff ?? null,
    agent_name: test.agent ?? "Claude",
    cli_output: `$ testsprite run — ${test.name}\n› starting…`,
    result: "pending",
  });
  log("  · pending (dashboard shows spinner)");

  const started = Date.now();
  const { output, passed } = await verify(test);
  const duration = Date.now() - started;

  const update = {
    result: passed ? "pass" : "fail",
    cli_output: output,
    duration_ms: duration,
  };
  await patch("loop_iterations", pending.id, update);
  const resolved = { ...pending, ...update };
  log(`  · ${passed ? "PASS ✅" : "FAIL ❌"} (${(duration / 1000).toFixed(1)}s)`);

  if (!passed) {
    log("  · asking AI for a fix…");
    const fix = await aiFix(resolved);
    if (fix) {
      await patch("loop_iterations", pending.id, {
        root_cause: fix.root_cause || null,
        ai_suggestion: JSON.stringify(fix),
      });
      resolved.ai_suggestion = JSON.stringify(fix);
      log(`  · AI: ${fix.root_cause ?? "(suggestion stored)"}`);
    }
  }
  return resolved;
}

// Verify step: real TestSprite command, or simulated.
async function verify(test) {
  if (CFG.runCmd) {
    const cmd = CFG.runCmd.replaceAll("{test}", test.name);
    try {
      const out = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
      return { output: `$ ${cmd}\n${out}`, passed: true };
    } catch (e) {
      const out = `$ ${cmd}\n${e.stdout ?? ""}${e.stderr ?? e.message}`;
      return { output: out, passed: false };
    }
  }
  // simulate
  await sleep(1500);
  const passed = test.expect !== "fail";
  const out = passed
    ? `$ testsprite run — ${test.name}\n✓ all assertions passed\nPASS in 1.5s`
    : `$ testsprite run — ${test.name}\n✗ assertion failed: ${test.failure ?? "unexpected state"}`;
  return { output: out, passed };
}

// ---------------------------------------------------------------------------
function log(m) {
  process.stdout.write(m + "\n");
}

function loadTests(args) {
  const idx = args.indexOf("--tests");
  if (idx !== -1 && args[idx + 1]) {
    return JSON.parse(readFileSync(args[idx + 1], "utf8"));
  }
  // default simulated loop that mirrors a real fix cycle
  const loopsIdx = args.indexOf("--loops");
  const loops = loopsIdx !== -1 ? Number(args[loopsIdx + 1]) : 3;
  const base = [
    {
      id: "TS-3001",
      name: "Dashboard streams a new iteration live",
      file: "src/lib/useLoopStream.ts",
      diff: "+  insforge.realtime.on('INSERT_iteration', onIteration)",
      expect: "fail",
      failure: "no realtime event received (channel not subscribed)",
    },
    {
      id: "TS-3001",
      name: "Dashboard streams a new iteration live",
      file: "src/lib/useLoopStream.ts",
      diff: "+  await insforge.realtime.subscribe(`loop:${sessionId}`)",
      expect: "pass",
    },
  ];
  return Array.from({ length: loops }, (_, i) => base[i % base.length]);
}

async function main() {
  const args = process.argv.slice(2);
  if (!CFG.baseUrl || !CFG.apiKey) {
    log("✗ Missing InsForge config (INSFORGE_URL / INSFORGE_API_KEY or .insforge/project.json).");
    process.exit(1);
  }
  if (!CFG.userId) {
    log("✗ LOOP_USER_ID is required — the app user to attach the session to.");
    log("  Get it after signing up in the app:");
    log("  npx @insforge/cli db query \"SELECT id, email FROM auth.users\"");
    process.exit(1);
  }
  log(CFG.runCmd ? "mode: REAL TestSprite" : "mode: --simulate");

  const tests = loadTests(args);
  const session = await createSession();
  const done = [];
  for (let i = 0; i < tests.length; i++) {
    done.push(await runIteration(session, i + 1, tests[i]));
  }
  await endSession(session.id, done);
  log(`\n✔ Watch it at ${CFG.appUrl}/session/${session.id}`);
}

main().catch((e) => {
  log("✗ " + (e?.message ?? e));
  process.exit(1);
});
