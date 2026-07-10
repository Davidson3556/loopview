# LoopView — LOOP.md

Each line below is one **write → verify → fix → verify** iteration. LoopView
visualizes this loop live; this file is the plain-text log. The app also
auto-generates a LOOP.md from any recorded session (History → *Generate LOOP.md*).

## Build loop — dogfooding while building
1. FAIL → PASS · `npm run build`: Tailwind v4 shipped by create-next-app conflicts with InsForge toolchain → pinned `tailwindcss@3.4` with explicit config.
2. FAIL → PASS · `db migrations up`: hand-named `0001_init.sql` rejected by CLI validation → regenerated with timestamped filenames, split schema + realtime.
3. FAIL → PASS · Settings save: assumed a `.upsert()` the InsForge SDK lacks → switched to select-then-update/insert.
4. FAIL → PASS · InsForge requests hit `…app//api/…` → trimmed trailing slash in the SDK client baseUrl.
5. FAIL → PASS · Signup sent no verification email ("admin user creation") → root cause: admin API key was used as the public anon key; swapped in the real anon key and rotated the exposed key.
6. PASS · `/api/ai-fix` returned a valid structured fix from Claude Sonnet on the first call.

## TestSprite loop — real run on LoopView's own codebase
7. PASS · TC002 Sign in and reach the dashboard.
8. PASS · TC004 Inspect the live dashboard overview.
9. PASS · TC005 End an active session from the dashboard.
10. FAIL · TC006 Review live loop progress — demo (logged-out) view has no active stream, so the live-update wait times out (expected).
11. PASS · TC008 See the unauthenticated dashboard demo state.
12. PASS · TC010 Inspect a timeline iteration.
13. PASS · TC011 Start a fresh session after ending the previous one.
14. PASS · TC012 Inspect a specific iteration from the timeline.
15. PASS · TC013 Analyze a failed iteration with AI suggestions.
16. PASS · TC014 View past sessions in history.
17. PASS · TC015 Verify the dashboard summary tiles.
18. FAIL → PASS · TC001 Create account was **blocked** (sign-up not reachable to the agent) → added `data-testid`/aria-label to the sign-up toggle, `/auth?mode=signup` deep-link, and `/login` `/signup` → `/auth` redirects → re-ran → PASS.
19. FAIL → PASS · TC003 Start a session (blocked by the same sign-up issue) → fixed by #18 → re-ran → PASS.
20. FAIL → PASS · TC007 Simulate an iteration (blocked by the same sign-up issue) → fixed by #18 → re-ran → PASS.
21. FAIL → PASS · TC009 Analyze a failed iteration (blocked by the same sign-up issue) → fixed by #18 → re-ran → PASS.

**Result:** the TestSprite session closed at **14/15 passing** after the fix. The one remaining fail (TC006) is expected behavior on the logged-out demo view.
