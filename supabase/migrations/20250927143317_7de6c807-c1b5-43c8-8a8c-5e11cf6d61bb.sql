-- Create user_favorites table to store favorited prompts and optimizations
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'optimization_history')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique favorites per user per item
  UNIQUE(user_id, item_id, item_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item ON public.user_favorites(item_id, item_type);