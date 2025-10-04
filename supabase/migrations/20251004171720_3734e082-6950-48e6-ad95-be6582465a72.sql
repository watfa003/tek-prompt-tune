-- Drop the existing check constraint
ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_item_type_check;

-- Add a new check constraint that includes all valid item types
ALTER TABLE public.user_favorites 
ADD CONSTRAINT user_favorites_item_type_check 
CHECK (item_type IN ('template', 'prompt', 'optimization', 'optimization_history'));