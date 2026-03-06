import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_NUMBER = "923001234567"; // Replace with actual number

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Step 1: Find subscriptions expiring within 2 days — send reminder
    const { data: expiringSubs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .gte("end_date", now.toISOString())
      .lte("end_date", twoDaysFromNow.toISOString());

    const remindersSent: string[] = [];

    if (expiringSubs && expiringSubs.length > 0 && resendApiKey) {
      for (const sub of expiringSubs) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        const email = userData?.user?.email;
        if (!email) continue;

        const daysLeft = Math.ceil(
          (new Date(sub.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          "Hi, I just paid for my Kaamyab subscription renewal. Here is my payment screenshot."
        )}`;

        // Send reminder email via Resend
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Kaamyab <noreply@verify-otp.kamyaab-ai.com>",
              to: [email],
              subject: "Your Kaamyab subscription expires soon",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1a1a1a;">Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}</h2>
                  <p style="color: #555;">To renew your <strong>${sub.plan_tier}</strong> plan, please send payment to:</p>
                  
                  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 4px 0; color: #333;"><strong>Bank Transfer</strong></p>
                    <p style="margin: 2px 0; color: #555;">Bank: Meezan Bank</p>
                    <p style="margin: 2px 0; color: #555;">Account: Kaamyab Technologies</p>
                    <p style="margin: 2px 0; color: #555;">Number: 02340105012345</p>
                    <br/>
                    <p style="margin: 4px 0; color: #333;"><strong>JazzCash:</strong> 0300-1234567</p>
                    <p style="margin: 4px 0; color: #333;"><strong>Easypaisa:</strong> 0345-1234567</p>
                  </div>
                  
                  <p style="color: #555;">After sending payment, submit your proof:</p>
                  <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 8px 0;">
                    Submit via WhatsApp
                  </a>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 24px;">
                    Or log in to your Kaamyab account and go to Profile → Upgrade Plan.
                  </p>
                </div>
              `,
            }),
          });
          remindersSent.push(email);
        } catch (emailErr) {
          console.error("Failed to send reminder to", email, emailErr);
        }
      }
    }

    // Step 2: Mark expired subscriptions
    const { data: expiredSubs } = await supabase
      .from("subscriptions")
      .select("id, user_id, grace_end")
      .eq("status", "active")
      .lt("end_date", now.toISOString());

    const expired: string[] = [];

    if (expiredSubs) {
      for (const sub of expiredSubs) {
        // Set to expired (but grace period may still apply)
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", sub.id);

        // Update profile state
        await supabase
          .from("profiles")
          .update({ subscription_state: "grace" })
          .eq("id", sub.user_id);

        expired.push(sub.id);
      }
    }

    // Step 3: Fully expired (past grace period)
    const { data: fullyExpiredSubs } = await supabase
      .from("subscriptions")
      .select("id, user_id")
      .eq("status", "expired")
      .lt("grace_end", now.toISOString());

    const fullyExpired: string[] = [];

    if (fullyExpiredSubs) {
      for (const sub of fullyExpiredSubs) {
        await supabase
          .from("subscriptions")
          .update({ status: "fully_expired" })
          .eq("id", sub.id);

        // Downgrade to standard
        await supabase
          .from("profiles")
          .update({
            subscription_tier: "standard",
            subscription_state: "expired",
            subscription_expires_at: null,
            grace_ends_at: null,
          })
          .eq("id", sub.user_id);

        fullyExpired.push(sub.id);
      }
    }

    return new Response(
      JSON.stringify({
        reminders_sent: remindersSent.length,
        expired: expired.length,
        fully_expired: fullyExpired.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Renewal reminder error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
