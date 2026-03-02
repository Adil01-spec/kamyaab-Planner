import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ valid: false, error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("plan_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ valid: false, error: "Invite not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Invite has expired" }), {
        status: 410,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return new Response(JSON.stringify({ valid: false, error: "Invite already accepted" }), {
        status: 410,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch plan title
    const { data: plan } = await supabase
      .from("plans")
      .select("plan_json")
      .eq("id", invite.plan_id)
      .single();

    const planJson = plan?.plan_json as { title?: string } | null;
    const planName = planJson?.title || "Execution Plan";

    // Fetch inviter name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invite.owner_id)
      .single();

    const inviterName = profile?.full_name || "Someone";

    return new Response(
      JSON.stringify({
        valid: true,
        plan_name: planName,
        inviter_name: inviterName,
        role: invite.role,
        collaborator_email: invite.collaborator_email,
        expires_at: invite.expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("validate-invite error:", error);
    return new Response(JSON.stringify({ valid: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
