import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "kaamyab.app@gmail.com";

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Forbidden");
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // ── Fetch dashboard data ──
    if (action === "dashboard") {
      const [profilesRes, subsRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, profession, created_at, subscription_tier, subscription_state, subscription_expires_at, pending_plan_tier, avatar_url").order("created_at", { ascending: false }).limit(500),
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("manual_payments").select("*").order("created_at", { ascending: false }).limit(200),
      ]);

      // Get user emails from auth
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const emailMap: Record<string, string> = {};
      authUsers?.users?.forEach((u: any) => { emailMap[u.id] = u.email || ""; });

      const profiles = (profilesRes.data || []).map((p: any) => ({
        ...p,
        email: emailMap[p.id] || "",
      }));

      return new Response(JSON.stringify({
        profiles,
        subscriptions: subsRes.data || [],
        payments: paymentsRes.data || [],
        emailMap,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Deactivate subscription ──
    if (action === "deactivate_subscription") {
      const { subscription_id } = body;
      await supabase.from("subscriptions").update({ status: "expired" }).eq("id", subscription_id);

      // Also update profile
      const { data: sub } = await supabase.from("subscriptions").select("user_id").eq("id", subscription_id).single();
      if (sub) {
        await supabase.from("profiles").update({
          subscription_tier: "standard",
          subscription_state: "active",
          subscription_expires_at: null,
          subscription_provider: null,
        }).eq("id", sub.user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Extend subscription ──
    if (action === "extend_subscription") {
      const { subscription_id, days = 30 } = body;
      const { data: sub } = await supabase.from("subscriptions").select("*").eq("id", subscription_id).single();
      if (!sub) throw new Error("Subscription not found");

      const currentEnd = new Date(sub.end_date);
      const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
      const newGrace = new Date(newEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

      await supabase.from("subscriptions").update({
        end_date: newEnd.toISOString(),
        grace_end: newGrace.toISOString(),
        status: "active",
      }).eq("id", subscription_id);

      await supabase.from("profiles").update({
        subscription_tier: sub.plan_tier,
        subscription_state: "active",
        subscription_expires_at: newEnd.toISOString(),
      }).eq("id", sub.user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
