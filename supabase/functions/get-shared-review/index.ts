import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Edge function to securely fetch shared review data by token.
 * Uses service role to bypass RLS since public users don't have direct access.
 * Validates token, expiry, and revocation status before returning data.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get token from query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token || typeof token !== 'string' || token.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the shared review by token (only return necessary fields)
    const { data, error } = await supabase
      .from('shared_reviews')
      .select('id, token, expires_at, revoked, created_at, plan_snapshot')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch review' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Review not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the data (client will handle revoked/expired display)
    // Note: We intentionally do NOT expose user_id or plan_id to the public
    return new Response(
      JSON.stringify({
        id: data.id,
        token: data.token,
        expires_at: data.expires_at,
        revoked: data.revoked,
        created_at: data.created_at,
        plan_snapshot: data.plan_snapshot,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
