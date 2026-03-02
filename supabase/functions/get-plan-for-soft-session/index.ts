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
    const { session_token } = await req.json();

    if (!session_token) {
      return new Response(
        JSON.stringify({ error: "Missing session token" }),
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

    // Fetch plan data
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("id, plan_json, created_at")
      .eq("id", session.plan_id)
      .single();

    if (planErr || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch comments for this plan
    const { data: comments } = await supabase
      .from("plan_comments")
      .select("id, author_name, content, target_type, target_ref, created_at, is_soft_author, soft_author_email")
      .eq("plan_id", session.plan_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Fetch feedback for this plan
    const { data: feedback } = await supabase
      .from("soft_feedback")
      .select("*")
      .eq("plan_id", session.plan_id)
      .order("created_at", { ascending: true });

    // Fetch suggestions for this plan
    const { data: suggestions } = await supabase
      .from("plan_suggestions")
      .select("*")
      .eq("plan_id", session.plan_id)
      .order("created_at", { ascending: true });

    // Extract day_closures and sanitize plan_json
    const planJson = plan.plan_json as any;
    const dayClosure = planJson?.day_closures || [];

    // Strip sensitive fields for external sessions
    const sensitiveKeys = [
      'user_id', 'owner_id', 'subscription_tier', 'subscription_state',
      'subscription_provider', 'subscription_expires_at', 'collaborator_list',
      'collaborators', 'strategic_access_level', 'strategic_calls_lifetime',
      'strategic_last_call_at', 'strategic_trial_used', 'email_domain_type',
      'email_verified_at', 'grace_ends_at', 'plan_memory',
    ];
    const sanitizedPlan = { ...planJson };
    for (const key of sensitiveKeys) {
      delete sanitizedPlan[key];
    }

    return new Response(
      JSON.stringify({
        plan_id: plan.id,
        plan_json: sanitizedPlan,
        created_at: plan.created_at,
        role: session.role,
        email: session.email,
        comments: comments || [],
        feedback: feedback || [],
        suggestions: suggestions || [],
        day_closures: dayClosure,
        session_expires_at: session.expires_at,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("get-plan-for-soft-session error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
