import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, serviceKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  code: string;
  type: 'signup' | 'password_reset' | 'email_change';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, type }: VerificationEmailRequest = await req.json();

    // For signups, block if email already exists
    if (type === 'signup') {
      try {
        const { data } = await supabase.auth.admin.getUserByEmail(email);
        if (data?.user) {
          return new Response(
            JSON.stringify({ error: 'Email already registered' }),
            { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } catch (adminErr) {
        console.error('Admin email check failed', adminErr);
        // Do not block signups on admin check failure
      }
    }

    console.log(`Sending verification email to ${email} for ${type}`);

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'signup':
        subject = 'Welcome to PrompTek - Verify Your Email';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to PrompTek!</h1>
            <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #2563eb; letter-spacing: 5px; font-size: 32px; margin: 0;">${code}</h2>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;
      
      case 'password_reset':
        subject = 'PrompTek - Password Reset Code';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>You requested to reset your password. Use the code below to proceed:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #2563eb; letter-spacing: 5px; font-size: 32px; margin: 0;">${code}</h2>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;

      case 'email_change':
        subject = 'PrompTek - Verify Your New Email';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Email Change Verification</h1>
            <p>You requested to change your email address. Use the code below to verify your new email:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #2563eb; letter-spacing: 5px; font-size: 32px; margin: 0;">${code}</h2>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>The PrompTek Team</p>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "PrompTek <noreply@promptekai.com>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
