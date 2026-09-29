CREATE TABLE public.vault_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL,
  salt text NOT NULL,
  iv text NOT NULL,
  cipher text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.vault_records TO authenticated;
GRANT ALL ON public.vault_records TO service_role;
ALTER TABLE public.vault_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vault select" ON public.vault_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own vault insert" ON public.vault_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own vault delete" ON public.vault_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.training_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  samples integer NOT NULL,
  clients integer NOT NULL,
  epochs integer NOT NULL,
  noise real NOT NULL,
  clip real NOT NULL,
  private_acc real NOT NULL,
  baseline_acc real NOT NULL,
  epsilon real,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.training_runs TO authenticated;
GRANT ALL ON public.training_runs TO service_role;
ALTER TABLE public.training_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs select" ON public.training_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.training_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs delete" ON public.training_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);