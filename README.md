<div align="center">

# LoopView

### Watch the TestSprite testing loop run live.

LoopView is a real-time dashboard that visualizes the **write → verify → fix → verify** loop as it happens — every code change, every TestSprite run, every failure and AI-suggested fix — streamed to a public URL.

**🔗 Live:** https://loopview.vercel.app

_Built for the **TestSprite Season 3 Hackathon**. The criterion is "judged on the loop, not polish or pitch" — so this app **is** the loop, visualized._

</div>

---

## 🧪 Proof: a real loop, closed on this app

LoopView isn't a mock — it ran the TestSprite loop **on its own codebase** and closed it end to end:

1. **Verify** — TestSprite generated a PRD + 47-case plan and executed 15 tests against LoopView → **10 / 15 passed**.
2. **Found a real bug** — the sign-up form wasn't reachable to an automated agent, which **blocked 4 tests**.
3. **Fix** — added a `data-testid` + accessible name to the sign-up toggle, a `/auth?mode=signup` deep-link, and `/login` `/signup` → `/auth` redirects.
4. **Re-verify** — re-ran the 4 blocked tests → **all 4 passed** → session now **14 / 15 (93%)**.

Every one of those results was **streamed into LoopView itself** as a live loop session. The full report and generated test suite live in [`testsprite_tests/`](./testsprite_tests) (PRD, test plan, 15 test cases, raw report).

> That is the entire premise: an agent writes, TestSprite verifies, LoopView shows the loop live, AI proposes the fix, you re-verify — and here it's demonstrated on the tool itself.

---

## What it does

| Panel | Shows |
|---|---|
| **Write** | The code diff just written — file, additions (green) / removals (red), and the agent (Claude, Cursor…) |
| **Verify** | TestSprite output streaming in real time, spinner while running, PASS ✅ / FAIL ❌ verdict + duration |
| **Result** | On pass: success card. On fail: root cause, screenshot slot, and a **live AI fix** from Claude Sonnet |
| **Timeline** | Every iteration, color-coded red → amber → green, click any to inspect |

Plus **Loop History**, one-click **LOOP.md export**, and **Session Replay** with scrub + playback.

## The loop, end to end

```
agent edits code ──▶ TestSprite verifies ──▶ LoopView streams it live ──▶ AI suggests a fix ──▶ re-verify
        │                    (MCP)                 (InsForge Realtime)      (Model Gateway)          │
        └─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Tech stack

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v3.4
- **Backend:** [InsForge](https://insforge.dev) — used for **everything**:

| InsForge feature | Used for |
|---|---|
| **Auth** | Email/password accounts |
| **PostgreSQL + RLS** | Loop sessions, iterations, artifacts, per-user settings — every row scoped to its owner |
| **Realtime** | Live iteration streaming on channel `loop:<session_id>` (DB trigger → `realtime.publish`) |
| **Model Gateway** | AI failure analysis via **Claude Sonnet** (OpenRouter) |
| **Storage** | Failure bundles / screenshots |

- **Testing:** TestSprite MCP · **Deploy:** Vercel

## Architecture

```
Next.js (Vercel)
├── app/                      /, /auth, /dashboard, /history, /session/[id], /settings, /docs
│   └── api/ai-fix            server route → InsForge Model Gateway (Claude Sonnet)
├── lib/
│   ├── insforge.ts           browser SDK client (singleton)
│   ├── AuthProvider.tsx      auth context
│   ├── loops.ts              sessions + iterations data layer
│   ├── useLoopStream.ts      realtime subscription hook (loop:<id>)
│   ├── aiFix.ts / loopMd.ts  AI-fix client + LOOP.md generator
│   └── simulateIteration.ts  drive the realtime path for demos
├── components/LoopView.tsx   the reusable 3-panel + timeline view
├── migrations/               InsForge schema + RLS + realtime trigger
├── scripts/
│   ├── loop-runner.mjs        local TestSprite loop runner
│   └── import-testsprite.mjs  stream a completed TestSprite run into LoopView
└── testsprite_tests/         real PRD, test plan, test cases, and report
```

## Run it locally

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:3000
```

`.env.local`:

```bash
NEXT_PUBLIC_INSFORGE_URL=https://<appkey>.<region>.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<anon key>        # public anon key (NOT the admin API key)
OPENROUTER_API_KEY=<from `npx @insforge/cli ai setup`>   # server-side only
```

Database (one time):

```bash
npx @insforge/cli link
npx @insforge/cli db migrations up --all   # tables + RLS + realtime trigger
```

## Reproduce the TestSprite loop

LoopView drives TestSprite through its **MCP server**, then imports the results:

```bash
# 1. Add the TestSprite MCP (once), then restart your IDE / agent
claude mcp add testsprite --env API_KEY=<your key> -- npx -y @testsprite/testsprite-mcp@latest

# 2. From your AI assistant: "test this project with TestSprite"
#    → bootstrap → generate PRD → generate test plan → run in TestSprite's cloud

# 3. Stream the completed run into LoopView
LOOP_USER_ID=<your app user uuid> node scripts/import-testsprite.mjs
```

Get `LOOP_USER_ID` after signing up in the app:

```bash
npx @insforge/cli db query "SELECT id, email FROM auth.users"
```

There's also a standalone runner for simulated or command-driven loops:

```bash
LOOP_USER_ID=<uuid> node scripts/loop-runner.mjs --simulate --loops 4
```

## Deploy

```bash
vercel --prod
# env: NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY, OPENROUTER_API_KEY
```

## More

- **[LOOP.md](./LOOP.md)** — the development loop log (real iterations caught while building)
- **[DEMO.md](./DEMO.md)** — 3-minute demo script
- **[testsprite_tests/](./testsprite_tests)** — the real PRD, test plan, and results
