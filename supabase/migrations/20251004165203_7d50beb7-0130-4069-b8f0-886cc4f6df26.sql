-- Create profiles table for usernames
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  bio text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Add favorites_count and uses_count to prompt_templates
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS favorites_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS uses_count integer DEFAULT 0 NOT NULL;

-- Update RLS policy to allow everyone to view public templates
DROP POLICY IF EXISTS "Users can view their own templates and public templates" ON public.prompt_templates;

CREATE POLICY "Everyone can view public templates and users can view their own"
ON public.prompt_templates
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Function to increment favorites count
CREATE OR REPLACE FUNCTION public.increment_template_favorites(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompt_templates
  SET favorites_count = favorites_count + 1
  WHERE id = template_id;
END;
$$;

-- Function to decrement favorites count
CREATE OR REPLACE FUNCTION public.decrement_template_favorites(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompt_templates
  SET favorites_count = GREATEST(favorites_count - 1, 0)
  WHERE id = template_id;
END;
$$;

-- Function to increment uses count
CREATE OR REPLACE FUNCTION public.increment_template_uses(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompt_templates
  SET uses_count = uses_count + 1
  WHERE id = template_id;
END;
$$;

-- Trigger to auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create index for public templates
CREATE INDEX IF NOT EXISTS idx_templates_public ON public.prompt_templates(is_public) WHERE is_public = true;

-- Create index for featured templates (most used)
CREATE INDEX IF NOT EXISTS idx_templates_uses ON public.prompt_templates(uses_count DESC);