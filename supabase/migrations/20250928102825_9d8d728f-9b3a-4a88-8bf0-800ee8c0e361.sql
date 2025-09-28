-- Fix function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;