-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Profile settings
  name TEXT,
  email TEXT,
  
  -- Default preferences
  default_provider TEXT DEFAULT 'OpenAI GPT-4',
  default_output_type TEXT DEFAULT 'Code',
  default_variants INTEGER DEFAULT 3,
  default_temperature DECIMAL(2,1) DEFAULT 0.7,
  default_max_tokens INTEGER DEFAULT 2048,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  prompt_completed BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  new_features BOOLEAN DEFAULT true,
  
  -- Privacy & Security
  data_retention_days INTEGER DEFAULT 30,
  share_analytics BOOLEAN DEFAULT false,
  two_factor_auth BOOLEAN DEFAULT false,
  
  -- Appearance
  theme TEXT DEFAULT 'dark',
  compact_mode BOOLEAN DEFAULT false,
  show_scores BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
ON public.user_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();