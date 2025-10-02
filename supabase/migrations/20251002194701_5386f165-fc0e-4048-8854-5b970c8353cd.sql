-- Add missing column to speed_optimizations table
ALTER TABLE public.speed_optimizations 
ADD COLUMN IF NOT EXISTS optimization_strategy text;