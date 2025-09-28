import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { model = "gemini-1.5-flash" } = await req.json().catch(() => ({ model: "gemini-1.5-flash" }));

    // Build Gemini request (v1 or v1beta both work; we use v1 here)
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: "Say hi" }],
        },
      ],
      generationConfig: { maxOutputTokens: 64, temperature: 0.2 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (_) {}

    // Helpful diagnostics
    const diagnostics = {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      model,
      endpoint: url,
      usedHeaders: ["Content-Type", "x-goog-api-key"],
      bodyPreview: text.slice(0, 500),
    };

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Gemini test failed", diagnostics }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const reply = Array.isArray(parts)
      ? parts.map((p: any) => p?.text).filter(Boolean).join("\n").trim()
      : "";

    return new Response(
      JSON.stringify({ text: reply || "(empty)", diagnostics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("gemini-diagnostic error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});