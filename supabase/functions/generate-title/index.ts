// Supabase Edge Function: generate-title
// Generates a short, human-friendly title from a prompt using OpenAI
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanText = (s: string | undefined): string => (s ?? "").trim();
    const input = cleanText(prompt);

    if (!input) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = [
      "You generate short, clear titles that capture what a user is asking for.",
      "Rules:",
      "- Output ONLY the title text, nothing else",
      "- 3-6 words maximum, under 50 characters",
      "- Use Title Case (capitalize first letter of major words)",
      "- NO quotes, emojis, punctuation, or special characters",
      "- NO prefixes like 'Prompt:', 'Task:', 'Request:', etc.",
      "- Focus on the core topic/action being requested",
      "Examples:",
      "  'write me code for a chatbot' → 'Chatbot Code Creation'",
      "  'help me with SEO for my site' → 'Website SEO Optimization'",
      "  'create a sushi ordering bot' → 'Sushi Order Bot'",
      "  'explain quantum physics simply' → 'Quantum Physics Explanation'"
    ].join("\n");

    console.log("Generating title for prompt:", input.slice(0, 100));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Generate a short title for:\n\n${input}` },
        ],
        temperature: 0.2,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "OpenAI API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    console.log("OpenAI response:", raw);

    // Sanitize and enforce constraints
    const sanitized = String(raw)
      .replace(/[\n\r]/g, " ")
      .replace(/["'`]/g, "")
      .trim();

    const words = sanitized.split(/\s+/).slice(0, 6);
    let title = words.join(" ");
    if (title.length > 50) title = title.slice(0, 47).trim() + "...";

    // Title Case
    const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","with"]);
    title = title
      .split(/\s+/)
      .map((w, i) => {
        const lw = w.toLowerCase();
        if (i === 0 || !minor.has(lw)) return lw.charAt(0).toUpperCase() + lw.slice(1);
        return lw;
      })
      .join(" ");

    if (!title) {
      console.error("No title generated");
      return new Response(JSON.stringify({ error: "Failed to generate title" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generated title:", title);

    return new Response(JSON.stringify({ title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-title error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});