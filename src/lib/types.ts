/**
 * Shared domain types for LoopView. These mirror the InsForge PostgreSQL schema
 * (see migrations/0001_init.sql).
 */

export type LoopStatus = "active" | "completed" | "aborted";
export type IterationResult = "pass" | "fail" | "pending";
export type ArtifactType = "screenshot" | "bundle" | "log";

export interface LoopSession {
  id: string;
  user_id: string;
  project_id: string;
  app_url: string;
  started_at: string;
  ended_at: string | null;
  total_loops: number;
  passed_loops: number;
  status: LoopStatus;
}

export interface LoopIteration {
  id: string;
  session_id: string;
  iteration_number: number;
  test_id: string | null;
  test_name: string | null;
  code_diff: string | null;
  file_changed: string | null;
  cli_output: string | null;
  result: IterationResult;
  root_cause: string | null;
  fix_applied: string | null;
  ai_suggestion: string | null;
  duration_ms: number | null;
  agent_name: string | null;
  created_at: string;
}

export interface TestArtifact {
  id: string;
  iteration_id: string;
  artifact_type: ArtifactType;
  storage_path: string;
  created_at: string;
}

/** Per-user connection settings (TestSprite key, project id, app url). */
export interface UserSettings {
  id: string;
  user_id: string;
  testsprite_api_key: string | null;
  testsprite_project_id: string | null;
  app_url: string | null;
  updated_at: string;
}

/** The three-phase loop, used to drive the dashboard panel state. */
export type LoopPhase = "write" | "verify" | "result";
