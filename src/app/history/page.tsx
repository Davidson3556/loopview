"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/AuthProvider";
import type { LoopSession } from "@/lib/types";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<LoopSession[] | null>(null);

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
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-slate-300 hover:bg-ink-850"
            title="Coming Day 5"
          >
            Generate LOOP.md
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
                  className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-850 p-5 hover:border-ink-600"
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
