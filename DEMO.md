# LoopView — 3-Minute Demo Script

**Live:** https://loopview.vercel.app · **Goal:** show the loop running live.

---

### 0:00–0:20 — The hook
> "This is judged on the loop, not polish — so I built the loop, visualized. This is LoopView: a real-time dashboard for the write → verify → fix → verify cycle."

- Open the **landing page**. Point at the three phases and the color-coded timeline strip (red → amber → green).

### 0:20–0:45 — Connect
> "You log in with InsForge Auth, connect a TestSprite project, and point it at the app under test."

- Go to **/auth**, sign in. Land on the dashboard. Briefly show **Settings** (TestSprite key + Project ID + app URL, stored per-user in InsForge).

### 0:45–1:40 — The loop runs live (the core)
> "Now the loop runs. Every iteration streams in over InsForge Realtime — no refresh."

- On the dashboard, **Start a loop session**.
- In a terminal, run the local runner:
  ```bash
  LOOP_USER_ID=<uuid> node scripts/loop-runner.mjs --simulate --loops 4
  ```
  _(or the real TestSprite command)_
- Cut back to the browser. Narrate as it streams:
  - **Write** panel shows the diff + agent name
  - **Verify** panel shows CLI output + spinner → **FAIL ❌**
  - The **timeline** adds a red block; connection dot is **live**
> "Two tabs, both update at once — that's InsForge Realtime."

### 1:40–2:20 — AI fix (InsForge Model Gateway)
> "On a failure, LoopView asks Claude Sonnet — through the InsForge Model Gateway — to diagnose it."

- Click **Analyze failure**. Show the streamed result: root cause, `file:line`, and a **copyable fix snippet**.
- Show the timeline turn **green** on the rerun pass.

### 2:20–2:45 — History, replay, export
> "Every session is stored. You can replay any loop and export it."

- Go to **History** → open a session → hit **▶ Replay** (scrub the timeline).
- Back on History, click **Generate LOOP.md** → show the formatted output → **Download**.

### 2:45–3:00 — Close
> "Write, verify, fix, verify — streamed live, analyzed by AI, replayable, and one click to a LOOP.md. Everything runs on InsForge: Auth, Postgres, Realtime, and the Model Gateway. That's LoopView."

- End on the dashboard with a green timeline.

---

**Shot checklist:** landing · auth · dashboard streaming (2 tabs) · AI analyze · replay · LOOP.md download.
