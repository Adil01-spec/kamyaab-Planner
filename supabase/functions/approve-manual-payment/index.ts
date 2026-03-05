import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "kaamyab.app@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // List all payments (admin)
    if (action === "list") {
      const { data, error } = await supabase
        .from("manual_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return new Response(JSON.stringify({ payments: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve or reject
    const { payment_id, notes } = body;
    if (!payment_id || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch payment
    const { data: payment, error: fetchErr } = await supabase
      .from("manual_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve") {
      // Update payment status
      await supabase
        .from("manual_payments")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq("id", payment_id);

      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Activate subscription on profile
      await supabase
        .from("profiles")
        .update({
          subscription_tier: payment.plan_tier,
          subscription_state: "active",
          subscription_expires_at: expiresAt.toISOString(),
          subscription_provider: "manual",
          pending_plan_tier: null,
          pending_expires_at: null,
        })
        .eq("id", payment.user_id);
    } else {
      // Reject
      await supabase
        .from("manual_payments")
        .update({
          status: "rejected",
          admin_notes: notes || null,
        })
        .eq("id", payment_id);

      // Clear pending state
      await supabase
        .from("profiles")
        .update({
          pending_plan_tier: null,
          pending_expires_at: null,
        })
        .eq("id", payment.user_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
