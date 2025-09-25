import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'get-templates':
        return await getTemplates(req, supabase);
      case 'save-template':
        return await saveTemplate(req, supabase);
      case 'update-template':
        return await updateTemplate(req, supabase);
      case 'delete-template':
        return await deleteTemplate(req, supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in template-manager function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getTemplates(req: Request, supabase: any) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const category = url.searchParams.get('category');
  const includePublic = url.searchParams.get('includePublic') === 'true';

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'User ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let query = supabase
    .from('prompt_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (includePublic) {
    query = query.or(`user_id.eq.${userId},is_public.eq.true`);
  } else {
    query = query.eq('user_id', userId);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ templates: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function saveTemplate(req: Request, supabase: any) {
  const { 
    userId, 
    title, 
    description, 
    template, 
    category = 'custom', 
    outputType = 'text',
    rating = 5,
    isPublic = false,
    tags = []
  } = await req.json();

  if (!userId || !title || !template) {
    return new Response(
      JSON.stringify({ error: 'User ID, title, and template are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('prompt_templates')
    .insert({
      user_id: userId,
      title,
      description,
      template,
      category,
      output_type: outputType,
      rating,
      is_public: isPublic,
      tags
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ template: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateTemplate(req: Request, supabase: any) {
  const { 
    templateId, 
    userId, 
    title, 
    description, 
    template, 
    category, 
    outputType,
    rating,
    isPublic,
    tags 
  } = await req.json();

  if (!templateId || !userId) {
    return new Response(
      JSON.stringify({ error: 'Template ID and User ID are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (template !== undefined) updateData.template = template;
  if (category !== undefined) updateData.category = category;
  if (outputType !== undefined) updateData.output_type = outputType;
  if (rating !== undefined) updateData.rating = rating;
  if (isPublic !== undefined) updateData.is_public = isPublic;
  if (tags !== undefined) updateData.tags = tags;

  const { data, error } = await supabase
    .from('prompt_templates')
    .update(updateData)
    .eq('id', templateId)
    .eq('user_id', userId) // Ensure user owns the template
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ template: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteTemplate(req: Request, supabase: any) {
  const { templateId, userId } = await req.json();

  if (!templateId || !userId) {
    return new Response(
      JSON.stringify({ error: 'Template ID and User ID are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { error } = await supabase
    .from('prompt_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId); // Ensure user owns the template

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}