import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = ["edit_task", "new_task", "adjust_deadline"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token, suggestion_type, target_ref, title, description } = await req.json();

    if (!session_token || !suggestion_type || !description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!VALID_TYPES.includes(suggestion_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid suggestion_type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate session
    const { data: session, error: sessionErr } = await supabase
      .from("soft_collab_sessions")
      .select("*")
      .eq("session_token", session_token)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (session.role !== "commenter") {
      return new Response(
        JSON.stringify({ error: "Only commenters can submit suggestions" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert suggestion
    const { data: suggestion, error: insertErr } = await supabase
      .from("plan_suggestions")
      .insert({
        plan_id: session.plan_id,
        session_id: session.id,
        email: session.email,
        suggestion_type,
        target_ref: target_ref || null,
        title: title?.trim() || null,
        description: description.trim(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert suggestion error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to save suggestion" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ suggestion }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("soft-collab-suggest error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
