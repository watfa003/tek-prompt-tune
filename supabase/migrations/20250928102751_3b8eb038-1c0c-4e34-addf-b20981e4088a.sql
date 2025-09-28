-- Create table for a global prompt counter
CREATE TABLE IF NOT EXISTS public.prompt_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_counter ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_counter' AND policyname = 'Anyone can view prompt counter'
  ) THEN
    CREATE POLICY "Anyone can view prompt counter"
    ON public.prompt_counter
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_counter' AND policyname = 'Authenticated users can update prompt counter'
  ) THEN
    CREATE POLICY "Authenticated users can update prompt counter"
    ON public.prompt_counter
    FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_counter' AND policyname = 'Authenticated users can insert prompt counter'
  ) THEN
    CREATE POLICY "Authenticated users can insert prompt counter"
    ON public.prompt_counter
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_prompt_counter_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_prompt_counter_updated_at
    BEFORE UPDATE ON public.prompt_counter
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Realtime support
ALTER TABLE public.prompt_counter REPLICA IDENTITY FULL;
DO $$
BEGIN
  -- Add to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prompt_counter'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prompt_counter;
  END IF;
END $$;

-- Atomic increment function
CREATE OR REPLACE FUNCTION public.increment_prompt_counter(delta integer DEFAULT 1)
RETURNS TABLE(id uuid, total integer) AS $$
DECLARE
  rec public.prompt_counter;
BEGIN
  -- Ensure a row exists
  IF NOT EXISTS (SELECT 1 FROM public.prompt_counter) THEN
    INSERT INTO public.prompt_counter (total) VALUES (0);
  END IF;

  -- Atomically increment the first row
  UPDATE public.prompt_counter
  SET total = total + GREATEST(delta, 0)
  WHERE id = (SELECT id FROM public.prompt_counter ORDER BY created_at ASC LIMIT 1)
  RETURNING public.prompt_counter.id, public.prompt_counter.total INTO rec;

  RETURN QUERY SELECT rec.id, rec.total;
END;
$$ LANGUAGE plpgsql;