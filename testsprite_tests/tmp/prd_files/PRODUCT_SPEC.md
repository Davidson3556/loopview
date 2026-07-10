# LoopView — Product Specification

## Overview
LoopView is a real-time dashboard that visualizes the automated testing loop
(**write → verify → fix → verify**) as it runs. It streams each test iteration
live, analyzes failures with AI, and lets users replay past runs and export a
LOOP.md report. Built on Next.js (App Router) with an InsForge backend
(auth, PostgreSQL, realtime, AI model gateway).

## Users & Auth
- Users sign up and sign in with **email + password**.
- Authenticated users have private data (sessions, iterations) scoped to them.
- Unauthenticated visitors can view the landing page and a demo dashboard.

## Pages & Expected Behavior

### 1. Landing page (`/`)
- Shows the product name "LoopView", a headline "Watch the testing loop run live",
  and three phase cards: **Write**, **Verify**, **Result**.
- Has a "Get started" / "Connect your project" button linking to `/auth`.
- Has a "See the dashboard" link to `/dashboard`.
- Displays a demo loop timeline strip with colored blocks (red/amber/green).

### 2. Auth (`/auth`)
- Toggle between **Sign in** and **Sign up** modes.
- Sign up collects name, email, password; sign in collects email, password.
- On success, the user is redirected to `/dashboard`.
- Invalid credentials show an inline error message.

### 3. Dashboard (`/dashboard`)
- Signed-out visitors see a demo loop with a banner prompting sign in.
- Signed-in users with no active session see a **"Start a loop session"** form
  (App URL under test, optional TestSprite Project ID) with a "Start session" button.
- An active session shows a controls bar with a live connection indicator, the
  session app URL, status, and buttons: **Simulate iteration**, **End**, **New session**.
- The main area shows three panels side by side:
  - **Write** — the code diff and changed file for the current iteration.
  - **Verify** — streaming CLI output and a PASS/FAIL/running verdict.
  - **Result** — pass card, or on failure: root cause, screenshot slot, and an
    **AI fix assistant** with an "Analyze failure" button.
- A **Loop timeline** at the bottom lists every iteration as a clickable block,
  color-coded by result (red=fail, amber=running, green=pass). Clicking a block
  shows that iteration in the panels.
- Stat tiles show Total loops, Passed, Pass rate, and Elapsed time.

### 4. History (`/history`)
- Lists the signed-in user's past loop sessions with app URL, timestamp,
  loop count, pass rate, and status.
- Each session links to its replay page.
- A **"Generate LOOP.md"** button opens a modal with the generated report and
  **Copy** and **Download** actions.

### 5. Session replay (`/session/[id]`)
- Loads a session and its iterations (only the owner can view).
- Provides a **Replay** button and a scrubber slider to step through iterations
  one by one, rendering the same three panels + timeline.

### 6. Settings (`/settings`)
- Signed-in users can save their TestSprite API key, TestSprite Project ID, and
  app URL. Values persist across reloads. A "Save settings" button confirms with
  a success message.

## Key User Flows to Verify
1. A visitor can sign up, then land on the dashboard.
2. A signed-in user can start a loop session and see it become active.
3. Clicking "Simulate iteration" adds a new iteration to the panels and timeline.
4. On a failed iteration, "Analyze failure" produces an AI suggestion.
5. Ending a session moves it to History.
6. "Generate LOOP.md" produces a downloadable report.
7. Settings values persist after saving and reloading.
