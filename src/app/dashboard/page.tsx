"use client";

import { useEffect, useState, useCallback } from "react";
import { AppNav } from "@/components/AppNav";
import { LoopView } from "@/components/LoopView";
import { LoopMark } from "@/components/LoopMark";
import { DEMO_ITERATIONS } from "@/lib/demo";
import { useAuth } from "@/lib/AuthProvider";
import { insforge } from "@/lib/insforge";
import { useLoopStream } from "@/lib/useLoopStream";
import {
  createSession,
  getLatestSession,
  endSession as endSessionApi,
  updateIteration,
} from "@/lib/loops";
import { simulateIteration } from "@/lib/simulateIteration";
import { requestAiFix } from "@/lib/aiFix";
import type { LoopIteration, LoopSession, UserSettings } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [session, setSession] = useState<LoopSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Load the user's latest session + connection settings once auth resolves.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSessionLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setSessionLoading(true);
      const [latest, settingsRes] = await Promise.all([
        getLatestSession(user.id),
        insforge.database
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setSession(latest);
      setSettings((settingsRes.data as UserSettings) ?? null);
      setSessionLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const { iterations, conn, refetch } = useLoopStream(session?.id ?? null);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const analyze = useCallback(
    async (it: LoopIteration) => {
      setAnalyzingId(it.id);
      const { result, error } = await requestAiFix(it);
      if (result && !error) {
        await updateIteration(it.id, {
          root_cause: result.root_cause || it.root_cause,
          ai_suggestion: JSON.stringify(result),
        });
        await refetch();
      }
      setAnalyzingId(null);
    },
    [refetch],
  );

  // ---- Logged-out: show demo loop so the public URL looks real ----
  if (!authLoading && !user) {
    return (
      <Shell>
        <Banner tone="fixing">
          Showing demo loop data —{" "}
          <a href="/auth" className="underline">
            sign in
          </a>{" "}
          to run and stream your own TestSprite loops.
        </Banner>
        <LoopView iterations={DEMO_ITERATIONS} startedAt={DEMO_ITERATIONS[0]?.created_at} />
      </Shell>
    );
  }

  if (authLoading || sessionLoading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </Shell>
    );
  }

  // ---- Logged-in, no session yet ----
  if (!session) {
    return (
      <Shell>
        <StartSession
          defaultAppUrl={settings?.app_url ?? ""}
          defaultProjectId={settings?.testsprite_project_id ?? ""}
          userId={user!.id}
          onCreated={setSession}
        />
      </Shell>
    );
  }

  // ---- Logged-in, active session: live stream ----
  const nextIteration =
    iterations.reduce((max, i) => Math.max(max, i.iteration_number), 0) + 1;

  return (
    <Shell>
      <ControlsBar
        session={session}
        conn={conn}
        nextIteration={nextIteration}
        onRefetch={refetch}
        onNewSession={() => setSession(null)}
        onEnded={(s) => setSession(s)}
      />
      <LoopView
        iterations={iterations}
        startedAt={session.started_at}
        onAnalyze={analyze}
        analyzingId={analyzingId}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      {children}
    </div>
  );
}

function Banner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "fixing" | "pass";
}) {
  return (
    <div
      className={`border-b border-white/[0.06] px-6 py-2 text-center text-xs backdrop-blur ${
        tone === "fixing"
          ? "bg-loop-fixing/[0.06] text-loop-fixing"
          : "bg-loop-pass/[0.06] text-loop-pass"
      }`}
    >
      {children}
    </div>
  );
}

function ControlsBar({
  session,
  conn,
  nextIteration,
  onRefetch,
  onNewSession,
  onEnded,
}: {
  session: LoopSession;
  conn: "disconnected" | "connecting" | "connected";
  nextIteration: number;
  onRefetch: () => void;
  onNewSession: () => void;
  onEnded: (s: LoopSession) => void;
}) {
  const [simRunning, setSimRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulated() {
    setSimRunning(true);
    setError(null);
    const { error } = await simulateIteration(session.id, nextIteration);
    if (error) setError(error);
    onRefetch();
    setSimRunning(false);
  }

  async function end() {
    await endSessionApi(session.id);
    onEnded({ ...session, status: "completed", ended_at: new Date().toISOString() });
  }

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3 text-sm">
      <div className="flex items-center gap-3">
        <ConnDot conn={conn} />
        <span className="hidden h-4 w-px bg-white/10 sm:block" />
        <span className="font-mono text-xs text-slate-400">
          {session.app_url}
        </span>
        <span
          className={`chip ${
            session.status === "active"
              ? "border-loop-fixing/30 bg-loop-fixing/10 text-loop-fixing"
              : "text-slate-400"
          }`}
        >
          {session.status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-loop-fail">{error}</span>}
        <button
          onClick={runSimulated}
          disabled={simRunning || session.status !== "active"}
          className="btn-brand px-3.5 py-1.5 text-sm"
          title="Insert a loop iteration to watch the realtime stream update the panels"
        >
          {simRunning ? "Running…" : "▶ Simulate iteration"}
        </button>
        {session.status === "active" && (
          <button onClick={end} className="btn-ghost px-3 py-1.5 text-sm">
            End
          </button>
        )}
        <button onClick={onNewSession} className="btn-ghost px-3 py-1.5 text-sm">
          New session
        </button>
      </div>
    </div>
  );
}

function ConnDot({
  conn,
}: {
  conn: "disconnected" | "connecting" | "connected";
}) {
  const map = {
    connected: {
      c: "bg-loop-pass",
      ring: "shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]",
      t: "live",
    },
    connecting: {
      c: "bg-loop-fixing animate-pulse",
      ring: "",
      t: "connecting",
    },
    disconnected: { c: "bg-loop-fail", ring: "", t: "offline" },
  }[conn];
  return (
    <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
      <span className={`h-2 w-2 rounded-full ${map.c} ${map.ring}`} />
      {map.t}
    </span>
  );
}

function StartSession({
  defaultAppUrl,
  defaultProjectId,
  userId,
  onCreated,
}: {
  defaultAppUrl: string;
  defaultProjectId: string;
  userId: string;
  onCreated: (s: LoopSession) => void;
}) {
  const [appUrl, setAppUrl] = useState(defaultAppUrl);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { session, error } = await createSession({
      userId,
      projectId: projectId || "unset",
      appUrl,
    });
    if (error || !session) {
      setError(error ?? "Could not create session");
      setBusy(false);
      return;
    }
    onCreated(session);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <form onSubmit={start} className="card w-full max-w-md p-7">
        <div className="mb-4 flex items-center gap-2.5">
          <LoopMark size={30} />
          <span className="chip border-brand/30 bg-brand/10 text-brand-light">
            new session
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Start a loop session
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          A session groups the write → verify → fix iterations for one run.
        </p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              App URL under test
            </span>
            <input
              required
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              TestSprite Project ID{" "}
              <span className="text-slate-600">(optional for now)</span>
            </span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="proj_…"
              className="field"
            />
          </label>
          {error && <p className="text-sm text-loop-fail">{error}</p>}
          <button type="submit" disabled={busy} className="btn-brand w-full py-2.5">
            {busy ? "Starting…" : "Start session"}
          </button>
        </div>
      </form>
    </div>
  );
}
