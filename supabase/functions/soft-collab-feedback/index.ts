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
    const { session_token, target_type, target_ref, content, strategy_score, feasibility_score, execution_score } = await req.json();

    if (!session_token || !target_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate target_type
    if (!["plan", "week", "task"].includes(target_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid target_type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate scores (1-5 or null)
    const validateScore = (s: any) => s === null || s === undefined || (Number.isInteger(s) && s >= 1 && s <= 5);
    if (!validateScore(strategy_score) || !validateScore(feasibility_score) || !validateScore(execution_score)) {
      return new Response(
        JSON.stringify({ error: "Scores must be 1-5 or null" }),
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
        JSON.stringify({ error: "Only commenters can submit feedback" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert feedback
    const { data: feedback, error: insertErr } = await supabase
      .from("soft_feedback")
      .insert({
        plan_id: session.plan_id,
        session_id: session.id,
        email: session.email,
        target_type,
        target_ref: target_ref || null,
        content: content?.trim() || null,
        strategy_score: strategy_score ?? null,
        feasibility_score: feasibility_score ?? null,
        execution_score: execution_score ?? null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert feedback error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to save feedback" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ feedback }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("soft-collab-feedback error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
