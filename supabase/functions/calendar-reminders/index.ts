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

    // Find events where reminder is due but not yet sent
    const { data: dueEvents, error: fetchError } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, reminder_minutes, user_id")
      .eq("reminder_sent", false)
      .not("reminder_minutes", "is", null)
      .filter(
        "start_time",
        "gte",
        new Date().toISOString() // only future/current events
      );

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
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
          reminder_due_at: new Date().toISOString(),
        })
        .in("id", toUpdate);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updatedCount = count || toUpdate.length;
    }

    console.log(`Processed ${updatedCount} reminders`);

    return new Response(
      JSON.stringify({ processed: updatedCount }),
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
