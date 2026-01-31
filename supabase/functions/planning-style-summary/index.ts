/**
 * Planning Style Summary Edge Function
 * 
 * Generates a human-readable summary of the user's planning style.
 * Strictly observational - no advice, no recommendations.
 * 
 * Core principle: Mirror, not coach.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanningStyleDimensions {
  planAdherence: number; // 0 = Planner, 1 = Improviser
  estimationBias: number; // 0 = Optimistic, 1 = Conservative
  executionPattern: number; // 0 = Linear, 1 = Iterative
  planningScope: number; // 0 = Strategic, 1 = Tactical
}

interface RequestBody {
  dimensions: PlanningStyleDimensions;
  plans_analyzed: number;
  history_metrics: {
    total_plans: number;
    strategic_plans: number;
    avg_completion: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { dimensions, plans_analyzed, history_metrics } = body;

    if (!dimensions) {
      return new Response(
        JSON.stringify({ error: 'Missing dimensions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from Lovable secret
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      // Fallback: generate summary without AI
      const fallbackSummary = generateFallbackSummary(dimensions, history_metrics);
      return new Response(
        JSON.stringify({ summary: fallbackSummary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt
    const prompt = buildPrompt(dimensions, plans_analyzed, history_metrics);

    // Call Lovable AI (OpenRouter proxy)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Kaamyab Planning Style',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an observational analyst that describes planning patterns. Your responses must be:
- Strictly observational (describe what IS, not what SHOULD BE)
- Neutral in tone (no good/bad, no judgment)
- 1-2 sentences maximum
- No advice, recommendations, or suggestions
- No "you should" or "try to" phrases
- No commands or imperatives

You are a mirror, not a coach. Your role is to reflect patterns back, not to change them.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      console.error('AI response error:', await response.text());
      const fallbackSummary = generateFallbackSummary(dimensions, history_metrics);
      return new Response(
        JSON.stringify({ summary: fallbackSummary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || generateFallbackSummary(dimensions, history_metrics);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating planning style summary:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  dimensions: PlanningStyleDimensions, 
  plans_analyzed: number,
  metrics: { total_plans: number; strategic_plans: number; avg_completion: number }
): string {
  // Convert dimension values to descriptive terms
  const adherence = dimensions.planAdherence < 0.35 ? 'closely follows plans' 
    : dimensions.planAdherence > 0.65 ? 'adapts plans during execution' 
    : 'balances planning and adaptation';
    
  const estimation = dimensions.estimationBias < 0.35 ? 'tends toward ambitious task scoping'
    : dimensions.estimationBias > 0.65 ? 'uses realistic time estimates'
    : 'shows balanced estimation';
    
  const execution = dimensions.executionPattern < 0.35 ? 'executes tasks sequentially'
    : dimensions.executionPattern > 0.65 ? 'revisits and adjusts during execution'
    : 'mixes sequential and iterative approaches';
    
  const scope = dimensions.planningScope < 0.35 ? 'focuses on long-term strategic planning'
    : dimensions.planningScope > 0.65 ? 'focuses on near-term tactical execution'
    : 'balances strategic and tactical thinking';

  return `Based on ${plans_analyzed} completed plans, describe this person's planning style in 1-2 sentences:

Planning patterns observed:
- Plan adherence: ${adherence}
- Time estimation: ${estimation}  
- Execution style: ${execution}
- Planning scope: ${scope}
- Average completion rate: ${Math.round(metrics.avg_completion)}%
- Strategic plans: ${metrics.strategic_plans} of ${metrics.total_plans}

Write a brief, neutral observation about their planning style. Be specific but not judgmental.`;
}

function generateFallbackSummary(
  dimensions: PlanningStyleDimensions,
  metrics: { avg_completion: number }
): string {
  const parts: string[] = [];
  
  // Adherence
  if (dimensions.planAdherence < 0.35) {
    parts.push('follows plans methodically');
  } else if (dimensions.planAdherence > 0.65) {
    parts.push('adapts plans flexibly during execution');
  }
  
  // Estimation
  if (dimensions.estimationBias < 0.35) {
    parts.push('scopes tasks ambitiously');
  } else if (dimensions.estimationBias > 0.65) {
    parts.push('estimates time conservatively');
  }
  
  // Scope
  if (dimensions.planningScope < 0.35) {
    parts.push('with a strategic focus');
  } else if (dimensions.planningScope > 0.65) {
    parts.push('with a tactical focus');
  }
  
  if (parts.length === 0) {
    return `Your planning style shows balanced tendencies across dimensions, with an average completion rate of ${Math.round(metrics.avg_completion)}%.`;
  }
  
  return `Your planning style ${parts.join(' and ')}.`;
}
