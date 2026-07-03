# LoopView

**Watch the TestSprite testing loop run live.** LoopView is a real-time dashboard that visualizes the `write → verify → fix → verify` loop as it happens — every code change, every TestSprite run, every failure and AI-suggested fix — streamed to a public URL.

Built for the **TestSprite Season 3 Hackathon**. The judging criterion is _"judged on the loop, not polish or pitch"_ — so this app **is** the loop, visualized.

🔗 **Live:** https://loopview.vercel.app

---

## What it does

| Panel | Shows |
|---|---|
| **Write** | The code diff just written — file, additions (green) / removals (red), and the agent (Claude, Cursor…) |
| **Verify** | TestSprite CLI output streaming in real time, spinner while running, PASS ✅ / FAIL ❌ verdict + duration |
| **Result** | On pass: success card. On fail: root cause, screenshot slot, and a **live AI fix** from Claude Sonnet |
| **Timeline** | Every iteration, color-coded red → amber → green, click any to inspect |

Plus: **Loop History**, one-click **LOOP.md export**, and **Session Replay** with scrub + playback.

## The loop, end to end

```
agent edits code ──▶ TestSprite verifies ──▶ LoopView streams it live ──▶ AI suggests a fix ──▶ rerun
        │                    (CLI)                  (InsForge Realtime)      (Model Gateway)         │
        └────────────────────────────────────────────────────────────────────────────────────────┘
```

The **local runner** (`scripts/loop-runner.mjs`) drives the loop from your machine and writes each iteration to InsForge; the deployed dashboard renders them live for anyone watching.

## Tech stack

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v3.4
- **Backend:** [InsForge](https://insforge.dev) for everything:
  - **Auth** — email/password accounts
  - **PostgreSQL** — loop sessions, iterations, artifacts (with Row-Level Security)
  - **Realtime** — live iteration streaming (channel `loop:<session_id>`)
  - **Model Gateway** — AI failure analysis via Claude Sonnet (OpenRouter)
  - **Storage** — failure bundles / screenshots
- **Deploy:** Vercel

## Architecture

```
Next.js (Vercel)
├── app/                      pages: /, /auth, /dashboard, /history, /session/[id], /settings
│   └── api/ai-fix            server route → InsForge Model Gateway (Claude Sonnet)
├── lib/
│   ├── insforge.ts           browser SDK client (singleton)
│   ├── AuthProvider.tsx      auth context
│   ├── loops.ts              sessions + iterations data layer
│   ├── useLoopStream.ts      realtime subscription hook
│   ├── aiFix.ts / loopMd.ts  AI fix client + LOOP.md generator
│   └── simulateIteration.ts  drive the realtime path without TestSprite
├── components/LoopView.tsx   the reusable 3-panel + timeline view
├── migrations/               InsForge schema + RLS + realtime trigger
└── scripts/loop-runner.mjs   local TestSprite loop runner
```

## Local development

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:3000
```

Required env (`.env.local`):

```bash
NEXT_PUBLIC_INSFORGE_URL=https://<appkey>.<region>.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<anon key>
OPENROUTER_API_KEY=<from `npx @insforge/cli ai setup`>   # server-side only
```

## Database setup

```bash
npx @insforge/cli link                 # link your InsForge project
npx @insforge/cli db migrations up --all   # tables + RLS + realtime trigger
```

## Running the loop

**Simulated (works today, no TestSprite needed):**

```bash
LOOP_USER_ID=<your app user uuid> node scripts/loop-runner.mjs --simulate --loops 4
```

**Real TestSprite:**

```bash
LOOP_USER_ID=<uuid> \
TESTSPRITE_PROJECT_ID=<id> \
TESTSPRITE_RUN_CMD='testsprite run --project $TESTSPRITE_PROJECT_ID --test {test}' \
node scripts/loop-runner.mjs --tests scripts/tests.example.json
```

Then open `https://loopview.vercel.app/dashboard` (or the printed `/session/<id>` link) and watch it stream.

Get your `LOOP_USER_ID` after signing up in the app:

```bash
npx @insforge/cli db query "SELECT id, email FROM auth.users"
```

## Deploy

```bash
vercel --prod    # env vars: NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY, OPENROUTER_API_KEY
```

See [LOOP.md](./LOOP.md) for the development loop log and [DEMO.md](./DEMO.md) for the demo script.
