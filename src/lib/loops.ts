import { insforge } from "./insforge";
import type { LoopIteration, LoopSession, IterationResult } from "./types";

/**
 * Data layer for loop sessions + iterations. Every call returns typed rows and
 * relies on InsForge RLS to scope reads/writes to the current user.
 */

export async function createSession(input: {
  userId: string;
  projectId: string;
  appUrl: string;
}): Promise<{ session: LoopSession | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from("loop_sessions")
    .insert([
      {
        user_id: input.userId,
        project_id: input.projectId,
        app_url: input.appUrl,
        status: "active",
      },
    ])
    .select();
  if (error) return { session: null, error: error.message ?? "insert failed" };
  return { session: (data?.[0] as LoopSession) ?? null, error: null };
}

export async function getSessions(userId: string): Promise<LoopSession[]> {
  const { data } = await insforge.database
    .from("loop_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  return (data as LoopSession[]) ?? [];
}

export async function getLatestSession(
  userId: string,
): Promise<LoopSession | null> {
  const { data } = await insforge.database
    .from("loop_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1);
  return ((data as LoopSession[]) ?? [])[0] ?? null;
}

export async function getSession(id: string): Promise<LoopSession | null> {
  const { data } = await insforge.database
    .from("loop_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as LoopSession) ?? null;
}

export async function getIterations(
  sessionId: string,
): Promise<LoopIteration[]> {
  const { data } = await insforge.database
    .from("loop_iterations")
    .select("*")
    .eq("session_id", sessionId)
    .order("iteration_number", { ascending: true });
  return (data as LoopIteration[]) ?? [];
}

export async function insertIteration(
  row: Partial<LoopIteration> & { session_id: string; iteration_number: number },
): Promise<{ iteration: LoopIteration | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from("loop_iterations")
    .insert([row])
    .select();
  if (error) return { iteration: null, error: error.message ?? "insert failed" };
  return { iteration: (data?.[0] as LoopIteration) ?? null, error: null };
}

export async function updateIteration(
  id: string,
  patch: Partial<LoopIteration>,
): Promise<{ error: string | null }> {
  const { error } = await insforge.database
    .from("loop_iterations")
    .update(patch)
    .eq("id", id);
  return { error: error?.message ?? null };
}

/** Recompute total/passed counts on the session after an iteration resolves. */
export async function refreshSessionCounts(
  sessionId: string,
): Promise<void> {
  const iterations = await getIterations(sessionId);
  const total = iterations.length;
  const passed = iterations.filter((i) => i.result === "pass").length;
  await insforge.database
    .from("loop_sessions")
    .update({ total_loops: total, passed_loops: passed })
    .eq("id", sessionId);
}

export async function endSession(sessionId: string): Promise<void> {
  await insforge.database
    .from("loop_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export type { IterationResult };
