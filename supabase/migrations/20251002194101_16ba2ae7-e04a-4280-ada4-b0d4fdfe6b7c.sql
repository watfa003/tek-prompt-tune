-- Add output_type and variants columns to agents table
ALTER TABLE public.agents 
ADD COLUMN output_type text DEFAULT 'text',
ADD COLUMN variants integer DEFAULT 3;