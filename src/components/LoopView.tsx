"use client";

import { useEffect, useState } from "react";
import type { LoopIteration } from "@/lib/types";
import { parseAiSuggestion } from "@/lib/aiFix";

/**
 * Presentational loop dashboard: stat tiles + Write/Verify/Result panels + the
 * clickable timeline. Driven purely by an iterations array, so it renders both
 * demo data (logged-out) and live realtime data (logged-in) identically.
 */
export function LoopView({
  iterations,
  startedAt,
  onAnalyze,
  analyzingId,
}: {
  iterations: LoopIteration[];
  startedAt?: string | null;
  onAnalyze?: (iteration: LoopIteration) => void;
  analyzingId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!pinned && iterations.length) {
      setSelectedId(iterations[iterations.length - 1].id);
    }
  }, [iterations, pinned]);

  const current =
    iterations.find((i) => i.id === selectedId) ??
    iterations[iterations.length - 1] ??
    null;

  const total = iterations.length;
  const passed = iterations.filter((i) => i.result === "pass").length;
  const passRate = total ? Math.round((passed / total) * 100) : 0;

  return (
    <>
      <div className="flex flex-wrap items-stretch gap-3 px-6 py-4">
        <StatTile label="Total loops" value={String(total)} />
        <StatTile label="Passed" value={String(passed)} tone="pass" />
        <StatTile label="Pass rate" value={`${passRate}%`} meter={passRate} />
        <StatTile label="Elapsed" value={<Elapsed startedAt={startedAt} />} />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-white/[0.06] lg:grid-cols-3">
        <WritePanel iteration={current} index="01" />
        <VerifyPanel iteration={current} index="02" />
        <ResultPanel
          iteration={current}
          index="03"
          onAnalyze={onAnalyze}
          analyzing={!!current && analyzingId === current.id}
        />
      </div>

      <Timeline
        iterations={iterations}
        selectedId={current?.id ?? null}
        onSelect={(id) => {
          setPinned(true);
          setSelectedId(id);
        }}
      />
    </>
  );
}

function Elapsed({ startedAt }: { startedAt?: string | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return <>—</>;
  const secs = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <>
      {m}m {s}s
    </>
  );
}

function StatTile({
  label,
  value,
  tone,
  meter,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "pass";
  meter?: number;
}) {
  return (
    <div className="min-w-[130px] flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={`mt-0.5 text-2xl font-semibold tabular-nums ${
          tone === "pass" ? "text-loop-pass" : "text-white"
        }`}
      >
        {value}
      </div>
      {meter != null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-loop-gradient transition-all duration-500"
            style={{ width: `${meter}%` }}
          />
        </div>
      )}
    </div>
  );
}

const ACCENTS = {
  fail: { dot: "bg-loop-fail", glow: "shadow-[0_0_10px_2px_rgba(251,90,116,0.6)]", line: "via-loop-fail/50" },
  fixing: { dot: "bg-loop-fixing", glow: "shadow-[0_0_10px_2px_rgba(251,191,36,0.6)]", line: "via-loop-fixing/50" },
  pass: { dot: "bg-loop-pass", glow: "shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]", line: "via-loop-pass/50" },
};

function PanelShell({
  title,
  index,
  accent,
  children,
}: {
  title: string;
  index: string;
  accent: keyof typeof ACCENTS;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className="relative flex min-h-[440px] flex-col bg-ink-900/40">
      <span
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${a.line} to-transparent`}
      />
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${a.dot} ${a.glow}`} />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-slate-600">{index}</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin p-5">{children}</div>
    </section>
  );
}

function EmptyPanelBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto scroll-thin rounded-xl border border-white/[0.06] bg-ink-950/80 p-4 text-xs leading-relaxed shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      {children}
    </pre>
  );
}

function WritePanel({
  iteration,
  index,
}: {
  iteration: LoopIteration | null;
  index: string;
}) {
  return (
    <PanelShell title="Write" index={index} accent="fail">
      {!iteration ? (
        <EmptyPanelBody>No iterations yet</EmptyPanelBody>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">
              {iteration.file_changed ?? "—"}
            </span>
            {iteration.agent_name && (
              <span className="chip border-brand/30 bg-brand/10 text-brand-light">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
                {iteration.agent_name}
              </span>
            )}
          </div>
          <CodeBlock>
            {(iteration.code_diff ?? "// no diff").split("\n").map((line, i) => {
              const add = line.startsWith("+");
              const del = line.startsWith("-");
              return (
                <div
                  key={i}
                  className={
                    add
                      ? "diff-add px-1"
                      : del
                        ? "diff-del px-1"
                        : "px-1 text-slate-400"
                  }
                >
                  <code className="font-mono">{line || " "}</code>
                </div>
              );
            })}
          </CodeBlock>
        </div>
      )}
    </PanelShell>
  );
}

function VerifyPanel({
  iteration,
  index,
}: {
  iteration: LoopIteration | null;
  index: string;
}) {
  const running = iteration?.result === "pending";
  return (
    <PanelShell title="Verify" index={index} accent="fixing">
      {!iteration ? (
        <EmptyPanelBody>Waiting for the first verify run</EmptyPanelBody>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-slate-400">
              {iteration.test_name ?? "TestSprite run"}
            </span>
            <Verdict result={iteration.result} />
          </div>
          <pre className="overflow-x-auto scroll-thin rounded-xl border border-white/[0.06] bg-ink-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
            {iteration.cli_output ?? "$ testsprite test run"}
            {running && (
              <span className="ml-1 inline-block animate-pulse text-loop-fixing">
                ▋
              </span>
            )}
          </pre>
          {iteration.duration_ms != null && (
            <div className="mt-2 text-right font-mono text-xs text-slate-500">
              {(iteration.duration_ms / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}
    </PanelShell>
  );
}

function ResultPanel({
  iteration,
  index,
  onAnalyze,
  analyzing,
}: {
  iteration: LoopIteration | null;
  index: string;
  onAnalyze?: (iteration: LoopIteration) => void;
  analyzing?: boolean;
}) {
  const failed = iteration?.result === "fail";
  return (
    <PanelShell title="Result" index={index} accent="pass">
      {!iteration ? (
        <EmptyPanelBody>Results appear here after each run</EmptyPanelBody>
      ) : iteration.result === "pass" ? (
        <div className="animate-slide-up rounded-2xl border border-loop-pass/25 bg-loop-pass/[0.07] p-5 shadow-glow-pass">
          <div className="text-3xl">✅</div>
          <div className="mt-2 text-lg font-semibold text-loop-pass">Passed</div>
          <div className="mt-1 text-sm text-slate-300">{iteration.test_name}</div>
        </div>
      ) : failed ? (
        <div className="animate-slide-up space-y-4">
          <div className="rounded-2xl border border-loop-fail/25 bg-loop-fail/[0.07] p-4 shadow-glow-fail">
            <div className="flex items-center gap-2 text-lg font-semibold text-loop-fail">
              ❌ Failed
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {iteration.test_name}
            </div>
          </div>

          {iteration.root_cause && (
            <Block label="Root cause">{iteration.root_cause}</Block>
          )}

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Screenshot
            </div>
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-ink-950/60 text-xs text-slate-600">
              failure bundle screenshot
            </div>
          </div>

          <AiFixSection
            iteration={iteration}
            onAnalyze={onAnalyze}
            analyzing={!!analyzing}
          />
        </div>
      ) : (
        <EmptyPanelBody>Waiting for verdict…</EmptyPanelBody>
      )}
    </PanelShell>
  );
}

function AiFixSection({
  iteration,
  onAnalyze,
  analyzing,
}: {
  iteration: LoopIteration;
  onAnalyze?: (iteration: LoopIteration) => void;
  analyzing: boolean;
}) {
  const structured = parseAiSuggestion(iteration.ai_suggestion);
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-2xl border border-brand/25 bg-gradient-to-b from-brand/[0.08] to-transparent p-4 shadow-glow-brand">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-light">
          ✨ AI fix assistant
        </span>
        {onAnalyze && (
          <button
            onClick={() => onAnalyze(iteration)}
            disabled={analyzing}
            className="rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-light transition hover:bg-brand/20 disabled:opacity-50"
          >
            {analyzing
              ? "Analyzing…"
              : iteration.ai_suggestion
                ? "Re-analyze"
                : "Analyze failure"}
          </button>
        )}
      </div>

      {analyzing ? (
        <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-light border-t-transparent" />
          Claude Sonnet is analyzing the failure bundle…
        </div>
      ) : structured ? (
        <div className="space-y-3">
          {structured.explanation && (
            <p className="text-sm leading-relaxed text-slate-300">
              {structured.explanation}
            </p>
          )}
          {structured.file && (
            <div className="chip font-mono text-slate-400">
              {structured.file}
              {structured.line != null && `:${structured.line}`}
            </div>
          )}
          {structured.fix_snippet && (
            <div>
              <pre className="overflow-x-auto scroll-thin rounded-xl border border-white/[0.06] bg-ink-950/80 p-3 text-xs text-slate-200">
                <code className="font-mono">{structured.fix_snippet}</code>
              </pre>
              <button
                onClick={() => copy(structured.fix_snippet ?? "")}
                className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/[0.08]"
              >
                {copied ? "Copied ✓" : "Copy fix"}
              </button>
            </div>
          )}
        </div>
      ) : iteration.ai_suggestion ? (
        <p className="text-sm text-slate-300">{iteration.ai_suggestion}</p>
      ) : (
        <p className="text-sm text-slate-500">
          {onAnalyze
            ? "Ask Claude Sonnet (via InsForge Model Gateway) to diagnose this failure and propose a fix."
            : "No AI suggestion yet."}
        </p>
      )}
    </div>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  );
}

function Verdict({ result }: { result: LoopIteration["result"] }) {
  if (result === "pass")
    return (
      <span className="chip border-loop-pass/30 bg-loop-pass/10 font-medium text-loop-pass">
        PASS ✅
      </span>
    );
  if (result === "fail")
    return (
      <span className="chip border-loop-fail/30 bg-loop-fail/10 font-medium text-loop-fail">
        FAIL ❌
      </span>
    );
  return (
    <span className="chip border-loop-fixing/30 bg-loop-fixing/10 text-loop-fixing">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-loop-fixing border-t-transparent" />
      running
    </span>
  );
}

function Timeline({
  iterations,
  selectedId,
  onSelect,
}: {
  iterations: LoopIteration[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border-t border-white/[0.06] bg-ink-900/40 px-6 py-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Loop timeline
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      {iterations.length === 0 ? (
        <div className="text-sm text-slate-600">
          No loops yet — each iteration will appear here as it runs.
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
          {iterations.map((it, i) => {
            const map = {
              pass: "bg-loop-pass shadow-[0_0_12px_2px_rgba(52,211,153,0.5)]",
              fail: "bg-loop-fail shadow-[0_0_12px_2px_rgba(251,90,116,0.5)]",
              pending: "bg-loop-fixing animate-pulse",
            } as const;
            const tone =
              it.result === "pass"
                ? map.pass
                : it.result === "fail"
                  ? map.fail
                  : map.pending;
            const selected = it.id === selectedId;
            return (
              <div key={it.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(it.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3.5 py-2.5 transition ${
                    selected
                      ? "border-brand/60 bg-white/[0.06] shadow-glow-brand"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                  }`}
                  title={it.test_name ?? undefined}
                >
                  <span className={`h-3.5 w-3.5 rounded-md ${tone}`} />
                  <span className="font-mono text-[10px] text-slate-500">
                    #{it.iteration_number}
                  </span>
                </button>
                {i < iterations.length - 1 && (
                  <span className="h-px w-5 bg-gradient-to-r from-white/15 to-white/5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
