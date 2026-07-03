# LoopView — Submission Checklist

**TestSprite Season 3 Hackathon** · Deadline: **July 7, 4:59 PM PDT (11:59 PM WAT)**

## Links
- Live app: https://loopview.vercel.app
- Repo: https://github.com/Davidson3556/loopview
- Demo video: _(record using [DEMO.md](./DEMO.md), ≤ 3 min)_

## The loop (judging criterion)
- [x] `write → verify → fix → verify` visualized as three live panels
- [x] Real-time streaming of iterations (InsForge Realtime)
- [x] AI failure analysis + fix suggestion (InsForge Model Gateway → Claude Sonnet)
- [x] Loop timeline, history, session replay
- [x] Auto-generated **LOOP.md** export
- [x] Local runner drives real/simulated TestSprite loops into the live dashboard
- [ ] **Final:** run a real TestSprite loop against the live URL (needs TestSprite Project ID)

## InsForge usage
- [x] Auth (accounts) · [x] PostgreSQL + RLS · [x] Realtime · [x] Model Gateway
- [x] Storage (schema + failure-bundle slot wired) · [x] declarative config (`insforge.toml`)

## Build & deploy
- [x] `npm run build` green · [x] deployed to Vercel · [x] all routes 200
- [x] `/api/ai-fix` verified live (real Claude output)
- [x] env vars set on Vercel (InsForge URL + anon key + OpenRouter key)

## Before submitting
- [ ] Record demo video (DEMO.md)
- [ ] Run the final live TestSprite loop; confirm it streams
- [ ] Rotate `TESTSPRITE_API_KEY` (was shared in chat during setup)
- [ ] Submit before the deadline
