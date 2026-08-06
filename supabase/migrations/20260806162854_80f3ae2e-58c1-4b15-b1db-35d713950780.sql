CREATE TABLE public.evaluation_references (
  recording_id uuid PRIMARY KEY REFERENCES public.recordings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_transcript text NOT NULL DEFAULT '',
  reference_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_references TO authenticated;
GRANT ALL ON public.evaluation_references TO service_role;
ALTER TABLE public.evaluation_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY evaluation_references_own_all ON public.evaluation_references FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER evaluation_references_set_updated_at BEFORE UPDATE ON public.evaluation_references FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.evaluation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Run',
  scope text NOT NULL DEFAULT 'workspace',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_runs TO authenticated;
GRANT ALL ON public.evaluation_runs TO service_role;
ALTER TABLE public.evaluation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY evaluation_runs_own_all ON public.evaluation_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);