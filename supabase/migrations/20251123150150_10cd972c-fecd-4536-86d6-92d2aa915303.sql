-- Add low_motion_mode column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS low_motion_mode boolean DEFAULT false;