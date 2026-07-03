"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LoopView } from "@/components/LoopView";
import { useAuth } from "@/lib/AuthProvider";
import { getSession, getIterations } from "@/lib/loops";
import type { LoopSession, LoopIteration } from "@/lib/types";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [session, setSession] = useState<LoopSession | null>(null);
  const [iterations, setIterations] = useState<LoopIteration[]>([]);
  const [loading, setLoading] = useState(true);

  // Replay playback: reveal iterations incrementally.
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [s, iters] = await Promise.all([getSession(id), getIterations(id)]);
      if (cancelled) return;
      setSession(s);
      setIterations(iters);
      setVisible(iters.length); // show everything by default
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  // Drive playback.
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setVisible((v) => {
        if (v >= iterations.length) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 900);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, iterations.length]);

  function replay() {
    setVisible(0);
    setPlaying(true);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="mx-auto w-full max-w-[1600px] px-6 py-4">
        <Link
          href="/history"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to history
        </Link>
      </div>

      {authLoading || loading ? (
        <Centered>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </Centered>
      ) : !user ? (
        <Centered>
          <p className="text-sm text-slate-400">
            <Link href="/auth" className="text-brand-light underline">
              Sign in
            </Link>{" "}
            to replay this session.
          </p>
        </Centered>
      ) : !session ? (
        <Centered>
          <p className="text-sm text-slate-400">
            Session not found (or not yours).
          </p>
        </Centered>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 bg-ink-900/60 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-400">
                {session.app_url}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(session.started_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {visible}/{iterations.length} shown
              </span>
              <input
                type="range"
                min={0}
                max={iterations.length}
                value={visible}
                onChange={(e) => {
                  setPlaying(false);
                  setVisible(Number(e.target.value));
                }}
                className="accent-brand"
              />
              <button
                onClick={() => (playing ? setPlaying(false) : replay())}
                disabled={iterations.length === 0}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {playing ? "⏸ Pause" : "▶ Replay"}
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <LoopView
              iterations={iterations.slice(0, visible)}
              startedAt={session.started_at}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      {children}
    </div>
  );
}
