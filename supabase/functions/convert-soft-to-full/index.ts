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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "No email found in token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find plan_collaborators matching email with null user_id
    const { data: collabs, error: collabErr } = await supabase
      .from("plan_collaborators")
      .select("id")
      .eq("collaborator_email", userEmail)
      .is("collaborator_user_id", null);

    if (collabErr) {
      console.error("Error finding collaborators:", collabErr);
    }

    let converted = 0;
    if (collabs && collabs.length > 0) {
      const ids = collabs.map((c: any) => c.id);
      const { error: updateErr } = await supabase
        .from("plan_collaborators")
        .update({ collaborator_user_id: userId, accepted_at: new Date().toISOString() })
        .in("id", ids);

      if (updateErr) {
        console.error("Error updating collaborators:", updateErr);
      } else {
        converted = ids.length;
      }
    }

    // Invalidate soft sessions for this email
    const { error: deleteErr } = await supabase
      .from("soft_collab_sessions")
      .delete()
      .eq("email", userEmail);

    if (deleteErr) {
      console.error("Error clearing soft sessions:", deleteErr);
    }

    return new Response(
      JSON.stringify({ converted, email: userEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("convert-soft-to-full error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
