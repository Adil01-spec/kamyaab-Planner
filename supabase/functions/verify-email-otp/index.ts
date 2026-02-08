import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return new Response(
        JSON.stringify({ verified: false, message: "Please enter a 6-digit code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch verification record
    const { data: verification, error: fetchError } = await adminClient
      .from('email_verifications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching verification:', fetchError);
      return new Response(
        JSON.stringify({ verified: false, message: "Verification error. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({ verified: false, message: "No verification pending. Please request a new code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      // Delete expired record
      await adminClient
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);

      return new Response(
        JSON.stringify({ verified: false, message: "Code expired. Please request a new code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code
    const providedHash = await hashCode(code);
    if (providedHash !== verification.code_hash) {
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid code. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success! Update profile and delete verification record
    const now = new Date().toISOString();

    // Upsert email_verified_at on profile (profile row might not exist yet)
    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email_verified_at: now,
        },
        {
          onConflict: 'id',
        }
      );

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      // Continue anyway - verification was successful
    }

    // Delete verification record
    await adminClient
      .from('email_verifications')
      .delete()
      .eq('id', verification.id);

    return new Response(
      JSON.stringify({ verified: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ verified: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
