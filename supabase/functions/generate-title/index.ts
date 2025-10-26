// Supabase Edge Function: generate-title
// Generates a short, human-friendly title from a prompt using Lovable AI Gateway
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cleanText = (s: string | undefined): string => (s ?? "").trim();
    const input = cleanText(prompt);

    if (!input) {
      return new Response(JSON.stringify({ title: "Untitled Session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = [
      "You generate concise, human-friendly titles for history items.",
      "Rules:",
      "- Output ONLY the title text, nothing else.",
      "- 3-6 words, max 50 characters.",
      "- Title Case each word.",
      "- No quotes, emojis, or extra punctuation.",
      "- No prefixes like 'Prompt:', 'Workflow:', etc.",
      "- Capture the main topic clearly (e.g., 'Sushi Order Bot', 'Website SEO Optimization').",
    ].join("\n");

    const body = {
      // Default model per Lovable AI docs is google/gemini-2.5-flash
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Create a very short, clear title for this text: \n\n${input}` },
      ],
      temperature: 0.2,
      stream: false,
    } as const;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    // Sanitize and enforce constraints just in case
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

    if (!title) title = "Untitled Session";

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