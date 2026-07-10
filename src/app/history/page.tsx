"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/AuthProvider";
import { getIterations } from "@/lib/loops";
import { generateLoopMd } from "@/lib/loopMd";
import type { LoopSession, LoopIteration } from "@/lib/types";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<LoopSession[] | null>(null);
  const [loopMd, setLoopMd] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await insforge.database
        .from("loop_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });
      setSessions((data as LoopSession[]) ?? []);
    })();
  }, [user]);

  async function generate() {
    if (!sessions) return;
    setGenerating(true);
    const entries = await Promise.all(
      sessions.map(async (s) => [s.id, await getIterations(s.id)] as const),
    );
    const map: Record<string, LoopIteration[]> = {};
    for (const [id, iters] of entries) map[id] = iters;
    setLoopMd(generateLoopMd(sessions, map));
    setGenerating(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Loop history</h1>
            <p className="mt-1 text-sm text-slate-400">
              Every session you&apos;ve run, replayable and exportable.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={generating || !sessions || sessions.length === 0}
            className="btn-brand px-4 py-2 text-sm disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate LOOP.md"}
          </button>
        </div>

        {loading ? (
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-ink-850" />
        ) : !user ? (
          <Empty>
            <a href="/auth" className="text-brand-light underline">
              Sign in
            </a>{" "}
            to see your loop history.
          </Empty>
        ) : sessions && sessions.length > 0 ? (
          <div className="mt-8 space-y-3">
            {sessions.map((s) => {
              const rate = s.total_loops
                ? Math.round((s.passed_loops / s.total_loops) * 100)
                : 0;
              return (
                <Link
                  key={s.id}
                  href={`/session/${s.id}`}
                  className="card flex items-center justify-between p-5 transition hover:border-white/15"
                >
                  <div>
                    <div className="font-mono text-sm text-slate-200">
                      {s.app_url}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(s.started_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <Metric label="Loops" value={String(s.total_loops)} />
                    <Metric label="Pass rate" value={`${rate}%`} />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        s.status === "active"
                          ? "bg-loop-fixing/15 text-loop-fixing"
                          : "bg-ink-700 text-slate-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty>
            No sessions yet. Head to the{" "}
            <a href="/dashboard" className="text-brand-light underline">
              dashboard
            </a>{" "}
            and start a loop.
          </Empty>
        )}
      </main>

      {loopMd !== null && (
        <LoopMdModal content={loopMd} onClose={() => setLoopMd(null)} />
      )}
    </div>
  );
}

function LoopMdModal({
  content,
  onClose,
}: {
  content: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function download() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LOOP.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[80vh] w-full max-w-3xl flex-col shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h2 className="font-semibold text-white">LOOP.md</h2>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="btn-ghost px-3 py-1.5 text-sm">
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button onClick={download} className="btn-brand px-3 py-1.5 text-sm">
              Download
            </button>
            <button onClick={onClose} className="btn-ghost px-3 py-1.5 text-sm">
              Close
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto scroll-thin p-5 text-xs leading-relaxed text-slate-300">
          <code className="font-mono whitespace-pre-wrap">{content}</code>
        </pre>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-ink-600 bg-ink-850 p-10 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
