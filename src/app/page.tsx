import Link from "next/link";

const PHASES = [
  {
    label: "Write",
    color: "text-loop-fail",
    ring: "ring-loop-fail/30",
    body: "The agent changes code. LoopView shows the diff live — file, line numbers, additions and removals.",
  },
  {
    label: "Verify",
    color: "text-loop-fixing",
    ring: "ring-loop-fixing/30",
    body: "TestSprite CLI runs. Its output streams into the middle panel in real time, with a spinner until the verdict lands.",
  },
  {
    label: "Result",
    color: "text-loop-pass",
    ring: "ring-loop-pass/30",
    body: "Pass ✅ or fail ❌. On failure: root cause, a screenshot from the bundle, and an AI-suggested fix.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <LoopMark />
          <span className="text-lg font-semibold tracking-tight">LoopView</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-100">
            Dashboard
          </Link>
          <Link href="/history" className="hover:text-slate-100">
            History
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-850 px-4 py-1.5 text-xs text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-loop-pass" />
          TestSprite Season 3 — judged on the loop, not the polish
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
          Watch the testing loop{" "}
          <span className="bg-gradient-to-r from-loop-fail via-loop-fixing to-loop-pass bg-clip-text text-transparent">
            run live
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          LoopView is a real-time dashboard for the{" "}
          <span className="text-slate-200">write → verify → fix → verify</span>{" "}
          loop. Every TestSprite iteration, streamed and visualized as it
          happens. This app <em>is</em> the loop.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/auth"
            className="rounded-lg bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
          >
            Connect your project
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-ink-600 px-6 py-3 font-medium text-slate-200 hover:bg-ink-850"
          >
            See the dashboard
          </Link>
        </div>
      </section>

      {/* Three panels */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {PHASES.map((p) => (
            <div
              key={p.label}
              className={`rounded-2xl border border-ink-700 bg-ink-850 p-6 ring-1 ${p.ring}`}
            >
              <div
                className={`text-sm font-semibold uppercase tracking-wider ${p.color}`}
              >
                {p.label}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline strip */}
        <div className="mt-10 rounded-2xl border border-ink-700 bg-ink-850 p-6">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loop timeline
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin">
            {DEMO_TIMELINE.map((state, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className={`h-8 w-8 shrink-0 rounded-md ${
                    state === "fail"
                      ? "bg-loop-fail/80"
                      : state === "fixing"
                        ? "bg-loop-fixing/80"
                        : "bg-loop-pass/80"
                  }`}
                  title={`Loop ${i + 1}: ${state}`}
                />
                {i < DEMO_TIMELINE.length - 1 && (
                  <span className="h-px w-3 bg-ink-600" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-6 text-xs text-slate-500">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-loop-fail align-middle" />
              failed
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-loop-fixing align-middle" />
              fixing
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-loop-pass align-middle" />
              passed
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-800 py-8 text-center text-xs text-slate-600">
        LoopView — built on Next.js + InsForge for the TestSprite Season 3
        Hackathon
      </footer>
    </main>
  );
}

const DEMO_TIMELINE = [
  "fail",
  "fixing",
  "fail",
  "fixing",
  "pass",
  "pass",
  "fail",
  "fixing",
  "pass",
] as const;

function LoopMark() {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center">
      <span className="absolute h-7 w-7 rounded-full bg-brand/20" />
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-light" fill="none">
        <path
          d="M4 12a8 8 0 1 1 2.34 5.66"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M4 20v-4h4"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
