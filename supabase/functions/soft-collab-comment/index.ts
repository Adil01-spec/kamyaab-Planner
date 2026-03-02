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
    const { session_token, target_type, target_ref, content } = await req.json();

    if (!session_token || !target_type || !content?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    if (session.role !== "commenter") {
      return new Response(
        JSON.stringify({ error: "You do not have permission to comment" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the invite to find owner_id (used as author_id placeholder)
    const { data: invite } = await supabase
      .from("plan_invites")
      .select("owner_id")
      .eq("id", session.invite_id)
      .single();

    if (!invite) {
      return new Response(
        JSON.stringify({ error: "Invite not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use email prefix as author name
    const authorName = session.email.split("@")[0] || session.email;

    // Insert comment via service role (bypasses RLS)
    const { data: comment, error: insertErr } = await supabase
      .from("plan_comments")
      .insert({
        plan_id: session.plan_id,
        author_id: invite.owner_id, // placeholder — soft users don't have auth.uid
        author_name: authorName,
        target_type,
        target_ref: target_ref || null,
        content: content.trim(),
      })
      .select("id, author_name, content, target_type, target_ref, created_at")
      .single();

    if (insertErr) {
      console.error("Failed to insert comment:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to post comment" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, comment }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("soft-collab-comment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
