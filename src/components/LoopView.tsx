"use client";

import { useEffect, useState } from "react";
import type { LoopIteration } from "@/lib/types";
import { parseAiSuggestion } from "@/lib/aiFix";

/**
 * Presentational loop dashboard: stat bar + Write/Verify/Result panels + the
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
  /** When provided, failed iterations get an "Analyze with AI" action. */
  onAnalyze?: (iteration: LoopIteration) => void;
  analyzingId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Follow the newest iteration unless the user has pinned an earlier one.
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
      <div className="flex flex-wrap items-center gap-6 border-b border-ink-800 px-6 py-3 text-sm">
        <Stat label="Total loops" value={String(total)} />
        <Stat label="Passed" value={String(passed)} tone="pass" />
        <Stat label="Pass rate" value={`${passRate}%`} />
        <Stat label="Elapsed" value={<Elapsed startedAt={startedAt} />} />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-ink-800 lg:grid-cols-3">
        <WritePanel iteration={current} />
        <VerifyPanel iteration={current} />
        <ResultPanel
          iteration={current}
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
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return <>{m}m {s}s</>;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "pass";
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className={`text-lg font-semibold ${
          tone === "pass" ? "text-loop-pass" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PanelShell({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[420px] flex-col bg-ink-900">
      <div className="flex items-center gap-2 border-b border-ink-800 px-5 py-3">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
      </div>
      <div className="flex-1 overflow-auto scroll-thin p-5">{children}</div>
    </section>
  );
}

function EmptyPanelBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-slate-600">
      {children}
    </div>
  );
}

function WritePanel({ iteration }: { iteration: LoopIteration | null }) {
  return (
    <PanelShell title="Write" accent="bg-loop-fail">
      {!iteration ? (
        <EmptyPanelBody>No iterations yet</EmptyPanelBody>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">
              {iteration.file_changed ?? "—"}
            </span>
            {iteration.agent_name && (
              <span className="rounded bg-brand/15 px-2 py-0.5 text-brand-light">
                {iteration.agent_name}
              </span>
            )}
          </div>
          <pre className="overflow-x-auto scroll-thin rounded-lg border border-ink-700 bg-ink-950 p-4 text-xs leading-relaxed">
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
          </pre>
        </>
      )}
    </PanelShell>
  );
}

function VerifyPanel({ iteration }: { iteration: LoopIteration | null }) {
  const running = iteration?.result === "pending";
  return (
    <PanelShell title="Verify" accent="bg-loop-fixing">
      {!iteration ? (
        <EmptyPanelBody>Waiting for the first verify run</EmptyPanelBody>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {iteration.test_name ?? "TestSprite run"}
            </span>
            <Verdict result={iteration.result} />
          </div>
          <pre className="overflow-x-auto scroll-thin rounded-lg border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {iteration.cli_output ?? "$ testsprite test run"}
            {running && (
              <span className="ml-1 inline-block animate-pulse">▋</span>
            )}
          </pre>
          {iteration.duration_ms != null && (
            <div className="mt-2 text-right text-xs text-slate-500">
              {(iteration.duration_ms / 1000).toFixed(1)}s
            </div>
          )}
        </>
      )}
    </PanelShell>
  );
}

function ResultPanel({
  iteration,
  onAnalyze,
  analyzing,
}: {
  iteration: LoopIteration | null;
  onAnalyze?: (iteration: LoopIteration) => void;
  analyzing?: boolean;
}) {
  const failed = iteration?.result === "fail";
  return (
    <PanelShell title="Result" accent="bg-loop-pass">
      {!iteration ? (
        <EmptyPanelBody>Results appear here after each run</EmptyPanelBody>
      ) : iteration.result === "pass" ? (
        <div className="animate-slide-up rounded-xl border border-loop-pass/30 bg-loop-pass/10 p-5">
          <div className="text-2xl">✅</div>
          <div className="mt-2 font-semibold text-loop-pass">Passed</div>
          <div className="mt-1 text-sm text-slate-300">{iteration.test_name}</div>
        </div>
      ) : failed ? (
        <div className="space-y-4 animate-slide-up">
          <div className="rounded-xl border border-loop-fail/30 bg-loop-fail/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-loop-fail">
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
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Screenshot
            </div>
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-ink-600 bg-ink-950 text-xs text-slate-600">
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
    <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-light">
          ✨ AI fix assistant
        </span>
        {onAnalyze && (
          <button
            onClick={() => onAnalyze(iteration)}
            disabled={analyzing}
            className="rounded-md border border-brand/40 px-2 py-1 text-xs text-brand-light hover:bg-brand/10 disabled:opacity-50"
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
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-light border-t-transparent" />
          Claude Sonnet is analyzing the failure bundle…
        </div>
      ) : structured ? (
        <div className="space-y-3">
          {structured.explanation && (
            <p className="text-sm text-slate-300">{structured.explanation}</p>
          )}
          {structured.file && (
            <div className="font-mono text-xs text-slate-400">
              {structured.file}
              {structured.line != null && `:${structured.line}`}
            </div>
          )}
          {structured.fix_snippet && (
            <div>
              <pre className="overflow-x-auto scroll-thin rounded-lg border border-ink-700 bg-ink-950 p-3 text-xs text-slate-200">
                <code className="font-mono">{structured.fix_snippet}</code>
              </pre>
              <button
                onClick={() => copy(structured.fix_snippet ?? "")}
                className="mt-2 rounded-md border border-ink-600 px-2 py-1 text-xs text-slate-300 hover:bg-ink-800"
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
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <p className="text-sm text-slate-300">{children}</p>
    </div>
  );
}

function Verdict({ result }: { result: LoopIteration["result"] }) {
  if (result === "pass")
    return <span className="text-xs font-medium text-loop-pass">PASS ✅</span>;
  if (result === "fail")
    return <span className="text-xs font-medium text-loop-fail">FAIL ❌</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs text-loop-fixing">
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
    <div className="border-t border-ink-800 bg-ink-900 px-6 py-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Loop timeline
      </div>
      {iterations.length === 0 ? (
        <div className="text-sm text-slate-600">
          No loops yet — each iteration will appear here as it runs.
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
          {iterations.map((it, i) => {
            const tone =
              it.result === "pass"
                ? "bg-loop-pass"
                : it.result === "fail"
                  ? "bg-loop-fail"
                  : "bg-loop-fixing animate-pulse";
            const selected = it.id === selectedId;
            return (
              <div key={it.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(it.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition ${
                    selected
                      ? "border-brand bg-ink-800"
                      : "border-ink-700 hover:border-ink-600"
                  }`}
                  title={it.test_name ?? undefined}
                >
                  <span className={`h-3 w-3 rounded-sm ${tone}`} />
                  <span className="text-[10px] text-slate-500">
                    #{it.iteration_number}
                  </span>
                </button>
                {i < iterations.length - 1 && (
                  <span className="h-px w-4 bg-ink-700" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
