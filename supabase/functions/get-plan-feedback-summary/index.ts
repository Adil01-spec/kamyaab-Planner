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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get owner's plan
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (planErr || !plan) {
      return new Response(
        JSON.stringify({ error: "No plan found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all feedback for this plan
    const { data: feedback } = await supabase
      .from("soft_feedback")
      .select("*")
      .eq("plan_id", plan.id)
      .order("created_at", { ascending: false });

    // Get all suggestions for this plan
    const { data: suggestions } = await supabase
      .from("plan_suggestions")
      .select("*")
      .eq("plan_id", plan.id)
      .order("created_at", { ascending: false });

    // Aggregate scores
    const feedbackItems = feedback || [];
    const scored = feedbackItems.filter((f: any) => f.strategy_score || f.feasibility_score || f.execution_score);
    
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    const summary = {
      plan_id: plan.id,
      feedback_count: feedbackItems.length,
      avg_strategy: avg(scored.filter((f: any) => f.strategy_score).map((f: any) => f.strategy_score)),
      avg_feasibility: avg(scored.filter((f: any) => f.feasibility_score).map((f: any) => f.feasibility_score)),
      avg_execution: avg(scored.filter((f: any) => f.execution_score).map((f: any) => f.execution_score)),
      feedback: feedbackItems,
      suggestions: suggestions || [],
      pending_suggestions: (suggestions || []).filter((s: any) => s.status === "pending").length,
    };

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("get-plan-feedback-summary error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
