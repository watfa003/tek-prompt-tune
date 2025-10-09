-- Add default_model column to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS default_model text DEFAULT 'gpt-4o-mini';