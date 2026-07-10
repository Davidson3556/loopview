"use client";

import { useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const PHASES = [
  {
    label: "Write",
    dot: "bg-loop-fail",
    text: "text-loop-fail",
    body: "The agent edits code. The Write panel renders the diff live — file path, line numbers, and every addition or removal.",
  },
  {
    label: "Verify",
    dot: "bg-loop-fixing",
    text: "text-loop-fixing",
    body: "The TestSprite CLI runs. Its stdout streams into the middle panel in real time, with a spinner until the verdict lands.",
  },
  {
    label: "Fix",
    dot: "bg-loop-fixing",
    text: "text-loop-fixing",
    body: "On failure, LoopView surfaces the root cause and an AI-suggested fix you can apply, then loop again.",
  },
  {
    label: "Result",
    dot: "bg-loop-pass",
    text: "text-loop-pass",
    body: "Pass ✅ or fail ❌ — plus a screenshot pulled from the TestSprite bundle so you can see exactly what the test saw.",
  },
];

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <p>
          LoopView is a real-time dashboard for the{" "}
          <span className="text-slate-200">write → verify → fix → verify</span>{" "}
          testing loop. Every TestSprite iteration is captured, streamed, and
          visualized as it happens, then stored so you can replay it later or
          export it as a submission-ready{" "}
          <code className="chip font-mono">LOOP.md</code>.
        </p>
        <p className="mt-3">
          Each <em>session</em> is one run against a target app URL. Each{" "}
          <em>iteration</em> within a session is a single trip around the loop —
          one code change, one test run, one verdict.
        </p>
      </>
    ),
  },
  {
    id: "lifecycle",
    title: "The loop lifecycle",
    body: (
      <>
        <p className="mb-5">
          A single iteration moves through four phases. LoopView shows all of
          them side by side as the loop runs.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PHASES.map((p) => (
            <div key={p.label} className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                <span
                  className={`text-sm font-semibold uppercase tracking-[0.18em] ${p.text}`}
                >
                  {p.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "connect",
    title: "Connect your project",
    body: (
      <>
        <p>
          Before running a loop, add your TestSprite credentials and the app URL
          under test in{" "}
          <Link href="/settings" className="text-brand-light underline">
            Settings
          </Link>
          . These are stored per-user and scoped by InsForge RLS.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>
            <span className="text-slate-200">TestSprite API key</span> —
            authenticates CLI runs (kept private).
          </li>
          <li>
            <span className="text-slate-200">TestSprite Project ID</span> —
            identifies which project&apos;s tests to run.
          </li>
          <li>
            <span className="text-slate-200">App URL under test</span> — the
            deployed URL TestSprite drives.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "Running a loop",
    body: (
      <>
        <p>
          Start a session from the{" "}
          <Link href="/dashboard" className="text-brand-light underline">
            Dashboard
          </Link>
          . As iterations stream in, the three panels update together: the diff
          on the left, TestSprite output in the middle, and the verdict with
          screenshot and AI fix on the right.
        </p>
        <p className="mt-3">
          Iteration state is color-coded everywhere in the app:
        </p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-400">
          <Legend color="bg-loop-fail" label="failed" />
          <Legend color="bg-loop-fixing" label="fixing / pending" />
          <Legend color="bg-loop-pass" label="passed" />
        </div>
      </>
    ),
  },
  {
    id: "history",
    title: "History & replay",
    body: (
      <>
        <p>
          Every session lands in{" "}
          <Link href="/history" className="text-brand-light underline">
            History
          </Link>{" "}
          with its loop count and pass rate. Open a session to replay it — scrub
          the timeline slider or hit{" "}
          <span className="text-slate-200">▶ Replay</span> to reveal iterations
          one at a time, exactly as they happened.
        </p>
      </>
    ),
  },
  {
    id: "loopmd",
    title: "Exporting LOOP.md",
    body: (
      <>
        <p>
          From History, <span className="text-slate-200">Generate LOOP.md</span>{" "}
          compiles all of your sessions into a single markdown log — one entry
          per iteration, with what changed, the result, the root cause, the fix,
          and the rerun outcome. Copy it or download it for your submission.
        </p>
        <pre className="mt-4 overflow-auto scroll-thin rounded-xl border border-white/[0.06] bg-ink-950/60 p-4 text-xs leading-relaxed text-slate-300">
          <code className="font-mono whitespace-pre">{`### Loop 3 — Checkout form validation
Date: Jul 10, 2026, 2:14 PM
What I built: src/app/checkout/page.tsx
Result: FAILED ❌
Root cause: Empty email passed client validation
Fix: Add required + pattern to the email field
Rerun result: PASSED ✅`}</code>
        </pre>
      </>
    ),
  },
];

export default function DocsPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <header>
          <span className="chip text-slate-400">Documentation</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            How LoopView works
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            A detailed guide to sessions, iterations, and the write → verify →
            fix → verify loop that LoopView visualizes.
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
          {/* Sticky table of contents */}
          <nav className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                On this page
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                    active === s.id
                      ? "border border-white/10 bg-white/[0.06] text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="min-w-0 space-y-14">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-4 text-xl font-semibold text-white">
                  {s.title}
                </h2>
                <div className="text-[15px] leading-relaxed text-slate-300">
                  {s.body}
                </div>
              </section>
            ))}

            <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="font-medium text-white">Ready to run a loop?</p>
                <p className="mt-1 text-sm text-slate-400">
                  Connect your project, then start a session.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/settings" className="btn-ghost px-5 py-2.5 text-sm">
                  Settings
                </Link>
                <Link href="/dashboard" className="btn-brand px-5 py-2.5 text-sm">
                  Open dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
