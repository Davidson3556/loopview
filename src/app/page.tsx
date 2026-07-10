import Link from "next/link";
import { LoopMark } from "@/components/LoopMark";

const PHASES = [
  {
    label: "Write",
    accent: "fail",
    dot: "bg-loop-fail",
    text: "text-loop-fail",
    line: "via-loop-fail/60",
    body: "The agent changes code. LoopView shows the diff live — file, line numbers, additions and removals.",
  },
  {
    label: "Verify",
    accent: "fixing",
    dot: "bg-loop-fixing",
    text: "text-loop-fixing",
    line: "via-loop-fixing/60",
    body: "TestSprite CLI runs. Its output streams into the middle panel in real time, with a spinner until the verdict lands.",
  },
  {
    label: "Result",
    accent: "pass",
    dot: "bg-loop-pass",
    text: "text-loop-pass",
    line: "via-loop-pass/60",
    body: "Pass ✅ or fail ❌. On failure: root cause, a screenshot from the bundle, and an AI-suggested fix.",
  },
];

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

export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <LoopMark size={28} />
          <span className="text-lg font-semibold tracking-tight text-white">
            LoopView
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm text-slate-400 sm:gap-6">
          <Link href="/dashboard" className="hidden hover:text-slate-100 sm:block">
            Dashboard
          </Link>
          <Link href="/history" className="hidden hover:text-slate-100 sm:block">
            History
          </Link>
          <Link href="/auth" className="btn-brand px-4 py-2 text-sm">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-slate-400 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-loop-pass shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
          TestSprite Season 3 — judged on the loop, not the polish
        </div>

        <div className="mb-8 flex justify-center">
          <div className="animate-float">
            <LoopMark size={72} />
          </div>
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl">
          Watch the testing loop{" "}
          <span className="animate-gradient-x bg-loop-gradient bg-[length:200%_auto] bg-clip-text text-transparent">
            run live
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          LoopView is a real-time dashboard for the{" "}
          <span className="text-slate-200">write → verify → fix → verify</span>{" "}
          loop. Every TestSprite iteration, streamed and visualized as it
          happens. This app <em>is</em> the loop.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link href="/auth" className="btn-brand px-6 py-3 text-base">
            Connect your project
          </Link>
          <Link href="/dashboard" className="btn-ghost px-6 py-3 text-base">
            See the dashboard
          </Link>
        </div>
      </section>

      {/* Three phases */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {PHASES.map((p) => (
            <div key={p.label} className="card relative overflow-hidden p-6">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${p.line} to-transparent`}
              />
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

        {/* Timeline strip */}
        <div className="card mt-10 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Loop timeline
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin">
            {DEMO_TIMELINE.map((state, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className={`h-9 w-9 shrink-0 rounded-lg ${
                    state === "fail"
                      ? "bg-loop-fail/90 shadow-[0_0_12px_2px_rgba(251,90,116,0.4)]"
                      : state === "fixing"
                        ? "bg-loop-fixing/90"
                        : "bg-loop-pass/90 shadow-[0_0_12px_2px_rgba(52,211,153,0.4)]"
                  }`}
                  title={`Loop ${i + 1}: ${state}`}
                />
                {i < DEMO_TIMELINE.length - 1 && (
                  <span className="h-px w-3 bg-white/10" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-6 text-xs text-slate-500">
            <Legend color="bg-loop-fail" label="failed" />
            <Legend color="bg-loop-fixing" label="fixing" />
            <Legend color="bg-loop-pass" label="passed" />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-600">
        LoopView — built on Next.js + InsForge for the TestSprite Season 3
        Hackathon
      </footer>
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
