import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Payload size limit
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 64 * 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { token, email, access_key } = await req.json();

    if (!token || !email || !access_key) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input validation
    if (typeof token !== 'string' || token.length > 500 ||
        typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        (typeof access_key !== 'string' && typeof access_key !== 'number')) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invite by token
    const { data: invite, error: fetchErr } = await supabase
      .from("plan_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (fetchErr || !invite) {
      return new Response(
        JSON.stringify({ error: "Invalid invitation" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invitation has expired." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check already accepted
    if (invite.accepted_at) {
      return new Response(
        JSON.stringify({ error: "This invitation has already been accepted." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check lock
    if (invite.locked_until && new Date(invite.locked_until) > new Date()) {
      const remainingMs = new Date(invite.locked_until).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return new Response(
        JSON.stringify({ error: `Too many attempts. Try again in ${remainingMin} minute${remainingMin === 1 ? '' : 's'}.`, locked: true }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check email match
    if (email.trim().toLowerCase() !== invite.collaborator_email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match the invitation." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Compare access key hash
    const providedHash = await sha256Hex(access_key.toString());
    if (providedHash !== invite.access_key_hash) {
      const newAttempts = (invite.access_key_attempts || 0) + 1;
      const updatePayload: Record<string, unknown> = { access_key_attempts: newAttempts };
      if (newAttempts >= 5) {
        updatePayload.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await supabase.from("plan_invites").update(updatePayload).eq("id", invite.id);

      return new Response(
        JSON.stringify({ error: "Incorrect access key.", attempts_remaining: Math.max(0, 5 - newAttempts) }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Success — generate session token
    const sessionBytes = new Uint8Array(16);
    crypto.getRandomValues(sessionBytes);
    const sessionToken = Array.from(sessionBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: sessionErr } = await supabase.from("soft_collab_sessions").insert({
      plan_id: invite.plan_id,
      invite_id: invite.id,
      email: invite.collaborator_email,
      role: invite.role,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    if (sessionErr) {
      console.error("Failed to create session:", sessionErr);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark invite as accepted
    await supabase.from("plan_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    // Also insert into plan_collaborators for consistency
    await supabase.from("plan_collaborators").insert({
      plan_id: invite.plan_id,
      owner_id: invite.owner_id,
      collaborator_email: invite.collaborator_email,
      role: invite.role,
      accepted_at: new Date().toISOString(),
    });

    // Fetch plan name and inviter name
    const { data: planData } = await supabase
      .from("plans")
      .select("plan_json")
      .eq("id", invite.plan_id)
      .single();

    const planJson = planData?.plan_json as { title?: string } | null;
    const planName = planJson?.title || "Execution Plan";

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invite.owner_id)
      .single();

    const inviterName = profileData?.full_name || "Plan Owner";

    return new Response(
      JSON.stringify({
        plan_id: invite.plan_id,
        role: invite.role,
        session_token: sessionToken,
        plan_name: planName,
        inviter_name: inviterName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("verify-soft-invite error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
