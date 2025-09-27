-- Add show_only_best_in_history column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN show_only_best_in_history boolean DEFAULT false;