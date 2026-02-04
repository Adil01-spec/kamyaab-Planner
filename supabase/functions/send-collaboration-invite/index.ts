import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kamyaab <noreply@updates.kamyaab.app>",
      to,
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return response.json();
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  collaboratorEmail: string;
  ownerName: string;
  planTitle: string;
  role: 'viewer' | 'commenter';
  appUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collaboratorEmail, ownerName, planTitle, role, appUrl }: InviteRequest = await req.json();

    if (!collaboratorEmail || !ownerName || !planTitle || !role || !appUrl) {
      throw new Error("Missing required fields");
    }

    const roleDescription = role === 'commenter' 
      ? 'view and leave comments on' 
      : 'view';

    const emailResponse = await resend.emails.send({
      from: "Kamyaab <noreply@updates.kamyaab.app>",
      to: [collaboratorEmail],
      subject: `${ownerName} invited you to collaborate on their plan`,
      html: `
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
              ${planTitle || 'Untitled Plan'}
            </p>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
              Your Role
            </p>
            <p style="margin: 0; font-size: 16px; color: #1a1a1a;">
              <span style="display: inline-block; background: ${role === 'commenter' ? '#e8f5e9' : '#e3f2fd'}; color: ${role === 'commenter' ? '#2e7d32' : '#1565c0'}; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
                ${role === 'commenter' ? 'Commenter' : 'Viewer'}
              </span>
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${appUrl}/plan" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
              View Plan
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center; margin: 0;">
            As a ${role}, you can ${roleDescription} the plan. You cannot modify tasks or execution.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            This email was sent by Kamyaab. If you didn't expect this invitation, you can safely ignore it.
          </p>
        </body>
        </html>
      `,
    });

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
