import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Known disposable email domains (subset)
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  'maildrop.cc', 'yopmail.com', 'throwaway.email', '10minutemail.com',
  'fakeinbox.com', 'trashmail.com', 'mailnesia.com', 'getnada.com',
]);

function classifyEmailDomain(email: string): 'disposable' | 'standard' | 'enterprise' {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'standard';
  
  if (DISPOSABLE_DOMAINS.has(domain)) return 'disposable';
  
  const freeProviders = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
  ]);
  
  if (!freeProviders.has(domain)) return 'enterprise';
  return 'standard';
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json();
    const targetEmail = email || user.email;

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: "No email provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Classify email domain for soft gating
    const domainType = classifyEmailDomain(targetEmail);

    // Generate OTP
    const otp = generateOTP();
    const codeHash = await hashCode(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Upsert verification record (replace existing if any)
    const { error: upsertError } = await adminClient
      .from('email_verifications')
      .upsert({
        user_id: user.id,
        email: targetEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error storing verification:', upsertError);
      return new Response(
        JSON.stringify({ error: "Could not create verification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure profile exists + persist email domain type (verification state lives on profile)
    const { error: profileUpsertError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email_domain_type: domainType,
        },
        {
          onConflict: 'id',
        }
      );

    if (profileUpsertError) {
      console.error('Error upserting profile domain type:', profileUpsertError);
      // Non-fatal: OTP email can still be sent
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kaamyab <noreply@verify-otp.kamyaab-ai.com>",
        to: [targetEmail],
        subject: "Your verification code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 24px;">
              Verify your email
            </h1>
            <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
              Enter this code to continue setting up your Kaamyab account:
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #888; line-height: 1.6;">
              This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', errorText);
      return new Response(
        JSON.stringify({ error: "Could not send verification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, domainType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Send OTP error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
