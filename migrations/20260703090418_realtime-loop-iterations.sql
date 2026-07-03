-- Realtime: publish every loop_iterations change so the dashboard updates live.
-- Channel pattern: loop:<session_id>

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('loop:%', 'Live loop iteration updates per session', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

CREATE OR REPLACE FUNCTION public.notify_loop_iteration()
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

DROP TRIGGER IF EXISTS loop_iteration_realtime ON public.loop_iterations;
CREATE TRIGGER loop_iteration_realtime
  AFTER INSERT OR UPDATE ON public.loop_iterations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loop_iteration();
