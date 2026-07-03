# LoopView — Loop Log

This is the real write → verify → fix → verify log from building LoopView. Each
entry is an iteration where a build/verify step surfaced a problem and a fix
closed it — the same loop LoopView visualizes. The app also **auto-generates**
this document from live TestSprite sessions (History → *Generate LOOP.md*); this
file is the hand-kept record of the development loop itself.

---

## Loop 1 — Tailwind must be v3.4, not v4
Date: 2026-07-02
What I built: Project scaffold + Tailwind install
Test created: build/verify (`npm run build`)
Result: FAILED
Root cause: `create-next-app` now ships Tailwind v4, but the InsForge toolchain requires v3.4 — config/PostCSS mismatch.
Fix: Scaffolded with `--no-tailwind`, then pinned `tailwindcss@3.4.17` with an explicit `tailwind.config.ts` + `postcss.config.mjs`.
Rerun result: PASSED ✅

## Loop 2 — Migration filename rejected by the CLI
Date: 2026-07-03
What I built: `migrations/0001_init.sql`
Test created: `npx @insforge/cli db migrations up --all`
Result: FAILED
Root cause: The CLI strictly validates every migration filename as `<timestamp>_<hyphen-name>.sql`; `0001_init.sql` is invalid and blocks the whole batch.
Fix: Regenerated via `db migrations new create-schema` / `realtime-loop-iterations` and moved the SQL in; split schema and realtime so a realtime error can't block table creation.
Rerun result: PASSED ✅ (2 migrations applied, verified in `pg_tables`)

## Loop 3 — InsForge SDK has no `.upsert()`
Date: 2026-07-03
What I built: Settings save (one row per user)
Test created: verify Settings persistence
Result: FAILED
Root cause: Assumed a Supabase-style `.upsert()`; the InsForge SDK only exposes insert/update/delete/select.
Fix: Select-then-update-or-insert against the unique `user_id`. Also switched single-object inserts to the required array form `insert([{...}])`.
Rerun result: PASSED ✅

## Loop 4 — Double-slash in InsForge request URLs
Date: 2026-07-03
What I built: InsForge browser client
Test created: verify API requests resolve
Result: FAILED
Root cause: The configured `NEXT_PUBLIC_INSFORGE_URL` had a trailing slash, producing `…app//api/…`.
Fix: Trim trailing slashes in the client (`baseUrl.replace(/\/+$/, "")`).
Rerun result: PASSED ✅ (InsForge REST returns 200)

## Loop 5 — Verification codes never arrived
Date: 2026-07-03
What I built: Email/password signup
Test created: manual signup on the deployed URL
Result: FAILED
Root cause: `require_email_verification = true` with no SMTP configured; the code path expected an email that wasn't deliverable in that setup.
Fix: Managed auth declaratively via `insforge.toml` + `config apply` so the setting is explicit and reversible (toggled for testing, then restored).
Rerun result: PASSED ✅

## Loop 6 — AI fix suggestion, live from the Model Gateway
Date: 2026-07-03
What I built: `/api/ai-fix` route (Claude Sonnet via InsForge Model Gateway)
Test created: live POST with a sample failed iteration
Result: PASSED ✅ first try
Root cause: —
Fix: —
Rerun result: PASSED ✅ (model `anthropic/claude-sonnet-5`, returned structured `{root_cause, explanation, file, line, fix_snippet}`)

---

_Generated and maintained during the TestSprite Season 3 build. Live sessions
produce their own LOOP.md via the in-app generator._
