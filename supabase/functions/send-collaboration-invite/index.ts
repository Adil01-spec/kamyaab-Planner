import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  collaboratorEmail: string;
  ownerName: string;
  planId: string;
  token: string;
  role: 'viewer' | 'commenter';
  appUrl: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { collaboratorEmail, ownerName, planId, token, role, appUrl }: InviteRequest = await req.json();

    if (!collaboratorEmail || !ownerName || !planId || !token || !role || !appUrl) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch plan title from DB
    const { data: planData } = await supabase
      .from("plans")
      .select("plan_json")
      .eq("id", planId)
      .single();

    const planJson = planData?.plan_json as { title?: string } | null;
    const planTitle = planJson?.title?.trim() || "Execution Plan";

    // Generate 5-digit access key server-side
    const accessKey = (10000 + Math.floor(Math.random() * 90000)).toString();
    const accessKeyHash = await sha256Hex(accessKey);

    // Store hash in plan_invites
    const { error: updateErr } = await supabase
      .from("plan_invites")
      .update({ access_key_hash: accessKeyHash })
      .eq("token", token);

    if (updateErr) {
      console.error("Failed to store access key hash:", updateErr);
      throw new Error("Failed to store access key");
    }

    const roleDescription = role === 'commenter' 
      ? 'view and leave comments on' 
      : 'view';

    const inviteLink = `${appUrl}/invite/${token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
            You're invited to collaborate
          </h1>
          <p style="margin: 0; color: #666; font-size: 16px;">
            ${ownerName} has invited you to ${roleDescription} their plan.
          </p>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
            Plan
          </p>
          <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 500; color: #1a1a1a;">
            ${planTitle}
          </p>
          
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Role
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #1a1a1a;">
            <span style="display: inline-block; background: ${role === 'commenter' ? '#e8f5e9' : '#e3f2fd'}; color: ${role === 'commenter' ? '#2e7d32' : '#1565c0'}; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
              ${role === 'commenter' ? 'Commenter' : 'Viewer'}
            </span>
          </p>

          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Access Key
          </p>
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 0;">
            <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', Courier, monospace;">
              ${accessKey}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #888;">
              Enter this key on the invite page to access the plan
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${inviteLink}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Open Invitation
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px; text-align: center; margin: 0;">
          As a ${role}, you can ${roleDescription} the plan. No account required.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
        
        <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
          This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
        </p>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kamyaab <noreply@verify-otp.kamyaab-ai.com>",
        to: [collaboratorEmail],
        subject: `${ownerName} invited you to collaborate on their plan`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const emailResponse = await response.json();
    console.log("Collaboration invite email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending collaboration invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
