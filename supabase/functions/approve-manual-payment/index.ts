import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = ["kaamyab.app@gmail.com", "rajaadil4445@gmail.com"];

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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const email = data.claims.email as string;
    if (!email || !ADMIN_EMAILS.includes(email)) {
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
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const graceEnd = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000).toISOString();

      // Create subscription record
      const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .insert({
          user_id: payment.user_id,
          plan_tier: payment.plan_tier,
          billing_cycle: "monthly",
          status: "active",
          start_date: startDate,
          end_date: endDate,
          grace_end: graceEnd,
          payment_source: "manual",
        })
        .select("id")
        .single();

      if (subErr) {
        console.error("Failed to create subscription:", subErr);
      }

      // Update payment status and link subscription
      await supabase
        .from("manual_payments")
        .update({
          status: "approved",
          approved_at: now.toISOString(),
          admin_notes: notes || null,
          subscription_id: sub?.id || null,
        })
        .eq("id", payment_id);

      // Activate subscription on profile
      await supabase
        .from("profiles")
        .update({
          subscription_tier: payment.plan_tier,
          subscription_state: "active",
          subscription_expires_at: endDate,
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
