-- Add is_official column to prompt_templates table
ALTER TABLE public.prompt_templates
ADD COLUMN is_official boolean NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_prompt_templates_is_official ON public.prompt_templates(is_official);

-- Add comment to explain the column
COMMENT ON COLUMN public.prompt_templates.is_official IS 'Indicates if this is an official PromptEK template';