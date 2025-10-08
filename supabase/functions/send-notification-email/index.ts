import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  email: string;
  subject: string;
  type: 'prompt_completed' | 'weekly_digest' | 'new_features';
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, type, data }: NotificationEmailRequest = await req.json();

    console.log(`Sending ${type} notification to ${email}`);

    let htmlContent = '';

    switch (type) {
      case 'prompt_completed':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Your Prompt Optimization is Complete!</h1>
            <p>We've finished optimizing your prompt. Here are the results:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p><strong>Original Prompt:</strong> ${data?.originalPrompt || 'N/A'}</p>
              <p><strong>Best Score:</strong> ${data?.bestScore || 'N/A'}</p>
            </div>
            <p>Log in to view the full results and optimized variants.</p>
            <a href="${data?.appUrl || 'https://lovable.dev'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Results</a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;

      case 'weekly_digest':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Your Weekly PrompTek Summary</h1>
            <p>Here's what happened this week:</p>
            <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
              <p><strong>Prompts Optimized:</strong> ${data?.promptsCount || 0}</p>
              <p><strong>Templates Used:</strong> ${data?.templatesUsed || 0}</p>
              <p><strong>Average Score:</strong> ${data?.avgScore || 'N/A'}</p>
            </div>
            <a href="${data?.appUrl || 'https://lovable.dev'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Dashboard</a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;

      case 'new_features':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">🎉 New Features in PrompTek!</h1>
            <p>${data?.featureDescription || 'We\'ve added exciting new features to improve your experience.'}</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              ${data?.features?.map((f: string) => `<p>✓ ${f}</p>`).join('') || ''}
            </div>
            <a href="${data?.appUrl || 'https://lovable.dev'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Try It Now</a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "PrompTek <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
