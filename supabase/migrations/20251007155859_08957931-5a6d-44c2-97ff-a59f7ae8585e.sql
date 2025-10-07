-- Update the profile username for the admin user to "promptel"
UPDATE public.profiles
SET username = 'promptel'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'watfa003@gmail.com'
);