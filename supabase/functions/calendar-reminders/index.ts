import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = Date.now();
    const nowIso = new Date().toISOString();

    // 1. Find events where reminder is due but not yet sent
    const { data: dueEvents, error: fetchError } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, reminder_minutes, user_id")
      .eq("reminder_sent", false)
      .not("reminder_minutes", "is", null)
      .gte("start_time", nowIso);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toUpdate: string[] = [];

    for (const event of dueEvents || []) {
      const startMs = new Date(event.start_time).getTime();
      const reminderMs = (event.reminder_minutes || 10) * 60 * 1000;
      const reminderDueAt = startMs - reminderMs;

      if (now >= reminderDueAt) {
        toUpdate.push(event.id);
      }
    }

    let updatedCount = 0;

    if (toUpdate.length > 0) {
      const { error: updateError, count } = await supabase
        .from("calendar_events")
        .update({
          reminder_sent: true,
          reminder_due_at: nowIso,
        })
        .in("id", toUpdate);

      if (updateError) {
        console.error("Update error:", updateError);
      } else {
        updatedCount = count || toUpdate.length;
      }
    }

    // 2. Mark past upcoming events as missed
    const { error: missedError, count: missedCount } = await supabase
      .from("calendar_events")
      .update({ status: "missed" })
      .eq("status", "upcoming")
      .lt("start_time", nowIso);

    if (missedError) {
      console.error("Missed update error:", missedError);
    }

    console.log(`Processed ${updatedCount} reminders, marked ${missedCount || 0} missed`);

    return new Response(
      JSON.stringify({ processed: updatedCount, missed: missedCount || 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
