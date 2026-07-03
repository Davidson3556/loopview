"use client";

import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { DEMO_ITERATIONS } from "@/lib/demo";
import type { LoopIteration } from "@/lib/types";

export default function DashboardPage() {
  const iterations = DEMO_ITERATIONS;
  const [selectedId, setSelectedId] = useState(
    iterations[iterations.length - 1]?.id,
  );
  const current =
    iterations.find((i) => i.id === selectedId) ??
    iterations[iterations.length - 1];

  const total = iterations.length;
  const passed = iterations.filter((i) => i.result === "pass").length;
  const passRate = total ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      {/* Demo banner */}
      <div className="border-b border-ink-800 bg-loop-fixing/5 px-6 py-2 text-center text-xs text-loop-fixing">
        Showing demo loop data — connect a project in{" "}
        <a href="/settings" className="underline">
          Settings
        </a>{" "}
        to stream real TestSprite runs.
      </div>

      {/* Stat bar */}
      <div className="flex flex-wrap items-center gap-6 border-b border-ink-800 px-6 py-3 text-sm">
        <Stat label="Total loops" value={String(total)} />
        <Stat label="Passed" value={String(passed)} tone="pass" />
        <Stat label="Pass rate" value={`${passRate}%`} />
        <Stat label="Elapsed" value="8m 12s" />
      </div>

      {/* 3 panels */}
      <div className="grid flex-1 grid-cols-1 gap-px bg-ink-800 lg:grid-cols-3">
        <WritePanel iteration={current} />
        <VerifyPanel iteration={current} />
        <ResultPanel iteration={current} />
      </div>

      {/* Timeline */}
      <Timeline
        iterations={iterations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pass";
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
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

function WritePanel({ iteration }: { iteration: LoopIteration }) {
  return (
    <PanelShell title="Write" accent="bg-loop-fail">
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
                add ? "diff-add px-1" : del ? "diff-del px-1" : "px-1 text-slate-400"
              }
            >
              <code className="font-mono">{line || " "}</code>
            </div>
          );
        })}
      </pre>
    </PanelShell>
  );
}

function VerifyPanel({ iteration }: { iteration: LoopIteration }) {
  const running = iteration.result === "pending";
  return (
    <PanelShell title="Verify" accent="bg-loop-fixing">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {iteration.test_name ?? "TestSprite run"}
        </span>
        <Verdict result={iteration.result} />
      </div>
      <pre className="overflow-x-auto scroll-thin rounded-lg border border-ink-700 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
        {iteration.cli_output ?? "$ testsprite test run"}
        {running && <span className="ml-1 inline-block animate-pulse">▋</span>}
      </pre>
      {iteration.duration_ms != null && (
        <div className="mt-2 text-right text-xs text-slate-500">
          {(iteration.duration_ms / 1000).toFixed(1)}s
        </div>
      )}
    </PanelShell>
  );
}

function ResultPanel({ iteration }: { iteration: LoopIteration }) {
  const failed = iteration.result === "fail";
  return (
    <PanelShell title="Result" accent="bg-loop-pass">
      {iteration.result === "pass" ? (
        <div className="rounded-xl border border-loop-pass/30 bg-loop-pass/10 p-5">
          <div className="text-2xl">✅</div>
          <div className="mt-2 font-semibold text-loop-pass">Passed</div>
          <div className="mt-1 text-sm text-slate-300">
            {iteration.test_name}
          </div>
        </div>
      ) : failed ? (
        <div className="space-y-4">
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

          {/* Screenshot thumbnail placeholder (real bundle image wired Day 3) */}
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Screenshot
            </div>
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-ink-600 bg-ink-950 text-xs text-slate-600">
              failure bundle screenshot
            </div>
          </div>

          {iteration.ai_suggestion && (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-light">
                ✨ AI fix suggestion
              </div>
              <p className="text-sm text-slate-300">{iteration.ai_suggestion}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-500">Waiting for verdict…</div>
      )}
    </PanelShell>
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
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border-t border-ink-800 bg-ink-900 px-6 py-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Loop timeline
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
        {iterations.map((it, i) => {
          const tone =
            it.result === "pass"
              ? "bg-loop-pass"
              : it.result === "fail"
                ? "bg-loop-fail"
                : "bg-loop-fixing";
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
                <span className="text-[10px] text-slate-500">#{it.iteration_number}</span>
              </button>
              {i < iterations.length - 1 && (
                <span className="h-px w-4 bg-ink-700" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
