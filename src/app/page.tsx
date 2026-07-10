import Link from "next/link";
import { LoopMark } from "@/components/LoopMark";

const STACK = [
  "TestSprite",
  "Next.js",
  "React",
  "TypeScript",
  "InsForge",
  "Vercel",
  "Playwright",
  "Tailwind CSS",
];

const PHASES = [
  {
    label: "Write",
    dot: "bg-loop-fail",
    text: "text-loop-fail",
    line: "via-loop-fail/60",
    body: "The agent changes code. LoopView shows the diff live — file, line numbers, additions and removals.",
  },
  {
    label: "Verify",
    dot: "bg-loop-fixing",
    text: "text-loop-fixing",
    line: "via-loop-fixing/60",
    body: "TestSprite CLI runs. Its output streams into the middle panel in real time, with a spinner until the verdict lands.",
  },
  {
    label: "Result",
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
    <main className="relative flex-1 overflow-x-clip">
      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <LoopMark size={28} />
          <span className="text-lg font-semibold tracking-tight text-white">
            LoopView
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm text-slate-400 sm:gap-6">
          <Link href="/docs" className="hidden hover:text-slate-100 sm:block">
            Docs
          </Link>
          <Link
            href="/dashboard"
            className="hidden hover:text-slate-100 sm:block"
          >
            Dashboard
          </Link>
          <Link href="/history" className="hidden hover:text-slate-100 sm:block">
            History
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-slate-200"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative flex min-h-[92vh] flex-col">
        {/* Cinematic background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="starfield" />
          <div className="starfield-twinkle animate-twinkle" />
          <div className="hero-planet-wrap">
            <div className="hero-planet" />
          </div>
        </div>

        {/* Centered hero content */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-44 pt-10 text-center">
          <div className="animate-slide-up">
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
              <span className="block bg-gradient-to-b from-slate-300 to-slate-500 bg-clip-text text-transparent">
                The live dashboard for
              </span>
              <span className="mt-1 block text-white drop-shadow-[0_2px_30px_rgba(99,102,241,0.35)]">
                every testing loop you run
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-slate-400">
              LoopView streams every TestSprite iteration —{" "}
              <span className="text-slate-200">write → verify → fix → verify</span>{" "}
              — and visualizes it the moment it happens. This app{" "}
              <em className="text-slate-300 not-italic">is</em> the loop.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-white px-7 py-3 text-base font-semibold text-ink-950 shadow-[0_8px_30px_-6px_rgba(255,255,255,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Connect your project
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/12 bg-white/[0.04] px-7 py-3 text-base font-medium text-slate-200 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                See the dashboard
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* ===================== STACK MARQUEE ===================== */}
      <section className="relative z-10 border-y border-white/[0.06] bg-ink-950/50 py-10 backdrop-blur-sm">
        <p className="mb-7 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">
          Built for the loop you already run
        </p>
        <div className="edge-fade-x flex overflow-hidden">
          <Marquee />
          <Marquee aria-hidden />
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-light/80">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Three panels, one loop, zero guesswork
          </h2>
          <p className="mt-3 text-slate-400">
            Every iteration flows left to right — what changed, what the test
            did, and how it ended.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
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

        {/* Closing CTA */}
        <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-8">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Watch your next loop run live
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Connect a TestSprite project and start a session in under a minute.
            </p>
          </div>
          <Link
            href="/auth"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-600">
        LoopView — built on Next.js + InsForge for the TestSprite Season 3
        Hackathon
      </footer>
    </main>
  );
}

function Marquee(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="flex shrink-0 animate-marquee items-center gap-14 pr-14"
      {...props}
    >
      {STACK.map((name) => (
        <span
          key={name}
          className="flex items-center gap-2.5 whitespace-nowrap text-lg font-medium text-slate-500"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand to-accent-cyan" />
          {name}
        </span>
      ))}
    </div>
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
