"use client";

import { use } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href="/history" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to history
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          Session replay
        </h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>

        <div className="mt-8 rounded-xl border border-dashed border-ink-600 bg-ink-850 p-10 text-center text-sm text-slate-400">
          Full iteration-by-iteration replay lands Day 5. It will step through
          every write → verify → result for this session, sourced from
          <span className="mx-1 font-mono text-slate-300">loop_iterations</span>
          in InsForge.
        </div>
      </main>
    </div>
  );
}
