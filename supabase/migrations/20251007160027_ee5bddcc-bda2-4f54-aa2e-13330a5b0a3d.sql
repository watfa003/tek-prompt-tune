-- Update the profile username for the admin user to "Promptek"
UPDATE public.profiles
SET username = 'Promptek'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'watfa003@gmail.com'
);