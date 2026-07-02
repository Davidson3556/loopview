-- LoopView schema — run via: npx @insforge/cli migrate (or the SQL editor)
-- Auth users live in InsForge's auth schema; we reference auth.uid() for RLS.

-- ---------------------------------------------------------------------------
-- Per-user connection settings (TestSprite key, project id, app url)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  testsprite_api_key TEXT,
  testsprite_project_id TEXT,
  app_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Loop sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  app_url TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_loops INT NOT NULL DEFAULT 0,
  passed_loops INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'aborted'))
);

CREATE INDEX IF NOT EXISTS idx_loop_sessions_user ON loop_sessions(user_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- Individual loop iterations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loop_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES loop_sessions(id) ON DELETE CASCADE,
  iteration_number INT NOT NULL,
  test_id TEXT,
  test_name TEXT,
  code_diff TEXT,
  file_changed TEXT,
  cli_output TEXT,
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pass', 'fail', 'pending')),
  root_cause TEXT,
  fix_applied TEXT,
  ai_suggestion TEXT,
  duration_ms INT,
  agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loop_iterations_session ON loop_iterations(session_id, iteration_number);

-- ---------------------------------------------------------------------------
-- Test artifacts (screenshots, failure bundles, logs — stored in InsForge Storage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id UUID NOT NULL REFERENCES loop_iterations(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('screenshot', 'bundle', 'log')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_artifacts_iteration ON test_artifacts(iteration_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — every user only sees their own rows
-- ---------------------------------------------------------------------------
ALTER TABLE user_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_artifacts  ENABLE ROW LEVEL SECURITY;

-- user_settings: owner-only
CREATE POLICY user_settings_owner ON user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- loop_sessions: owner-only
CREATE POLICY loop_sessions_owner ON loop_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- loop_iterations: access gated through the owning session
CREATE POLICY loop_iterations_owner ON loop_iterations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loop_sessions s
      WHERE s.id = loop_iterations.session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loop_sessions s
      WHERE s.id = loop_iterations.session_id AND s.user_id = auth.uid()
    )
  );

-- test_artifacts: access gated through the owning iteration -> session
CREATE POLICY test_artifacts_owner ON test_artifacts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loop_iterations i
      JOIN loop_sessions s ON s.id = i.session_id
      WHERE i.id = test_artifacts.iteration_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loop_iterations i
      JOIN loop_sessions s ON s.id = i.session_id
      WHERE i.id = test_artifacts.iteration_id AND s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime: publish every iteration change so the dashboard updates live.
-- Channel pattern: loop:<session_id>
-- ---------------------------------------------------------------------------
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('loop:%', 'Live loop iteration updates per session', true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION notify_loop_iteration()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'loop:' || NEW.session_id::text,
    TG_OP || '_iteration',
    jsonb_build_object(
      'id', NEW.id,
      'session_id', NEW.session_id,
      'iteration_number', NEW.iteration_number,
      'result', NEW.result
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS loop_iteration_realtime ON loop_iterations;
CREATE TRIGGER loop_iteration_realtime
  AFTER INSERT OR UPDATE ON loop_iterations
  FOR EACH ROW
  EXECUTE FUNCTION notify_loop_iteration();
