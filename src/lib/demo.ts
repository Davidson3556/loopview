import type { LoopIteration } from "./types";

/**
 * Demo iterations used to render the dashboard before live TestSprite data is
 * wired in (Day 2). Shaped exactly like rows from `loop_iterations`.
 */
export const DEMO_ITERATIONS: LoopIteration[] = [
  {
    id: "demo-1",
    session_id: "demo-session",
    iteration_number: 1,
    test_id: "TS-1042",
    test_name: "User can sign in with email + password",
    file_changed: "src/app/auth/page.tsx",
    code_diff: `@@ -42,7 +42,7 @@ export default function AuthPage() {
-  const { error } = await insforge.auth.signIn({ email });
+  const { error } = await insforge.auth.signInWithPassword({ email, password });
   if (error) throw error;`,
    cli_output: `$ testsprite test run --id TS-1042
› launching browser…
› navigating to https://loopview.vercel.app/auth
✗ assertion failed: expected redirect to /dashboard
  received: still on /auth (password field ignored)`,
    result: "fail",
    root_cause:
      "signIn() was called without the password argument, so the credential check silently no-ops.",
    fix_applied: "Switched to signInWithPassword({ email, password }).",
    ai_suggestion:
      "Use `signInWithPassword` and pass both `email` and `password`. The `signIn` helper only starts a passwordless flow.",
    duration_ms: 4200,
    agent_name: "Claude",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "demo-2",
    session_id: "demo-session",
    iteration_number: 2,
    test_id: "TS-1042",
    test_name: "User can sign in with email + password",
    file_changed: "src/lib/AuthProvider.tsx",
    code_diff: `@@ -18,6 +18,7 @@ export function AuthProvider() {
   const [user, setUser] = useState(null);
+  const [loading, setLoading] = useState(true);`,
    cli_output: `$ testsprite test run --id TS-1042
› launching browser…
› navigating to https://loopview.vercel.app/auth
✓ redirected to /dashboard
✓ session persisted across reload
PASS (1 assertion) in 3.9s`,
    result: "pass",
    root_cause: null,
    fix_applied: null,
    ai_suggestion: null,
    duration_ms: 3900,
    agent_name: "Claude",
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    id: "demo-3",
    session_id: "demo-session",
    iteration_number: 3,
    test_id: "TS-1108",
    test_name: "Dashboard shows live loop timeline",
    file_changed: "src/app/dashboard/page.tsx",
    code_diff: `@@ -70,0 +71,4 @@
+  useEffect(() => {
+    const chan = insforge.realtime.subscribe(\`loop:\${sessionId}\`);
+  }, [sessionId]);`,
    cli_output: `$ testsprite test run --id TS-1108
› launching browser…
› waiting for [data-testid="timeline"]
✗ timeout: element never appeared (10000ms)`,
    result: "fail",
    root_cause:
      "Realtime channel 'loop:%' pattern was not registered, so no iteration events reached the client.",
    fix_applied: null,
    ai_suggestion:
      "Insert the channel pattern into realtime.channels with enabled = true before subscribing from the client.",
    duration_ms: 10000,
    agent_name: "Claude",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];
