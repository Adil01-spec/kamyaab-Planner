import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OperatingStyleDimensions {
  planningDensity: number;
  executionFollowThrough: number;
  adjustmentBehavior: number;
  cadencePreference: number;
}

interface RequestPayload {
  dimensions: OperatingStyleDimensions;
  metrics: {
    totalPlans: number;
    avgTasksPerWeek: number;
    avgCompletionRate: number;
  };
}

/**
 * Generate a dimension description based on value
 */
function describeDimension(value: number, leftLabel: string, rightLabel: string): string {
  if (value < 0.3) return `leans toward ${leftLabel}`;
  if (value > 0.7) return `leans toward ${rightLabel}`;
  return `balanced between ${leftLabel} and ${rightLabel}`;
}

/**
 * Generate a template-based fallback summary
 */
function generateTemplateSummary(
  dimensions: OperatingStyleDimensions,
  planCount: number
): string {
  const parts: string[] = [];
  
  // Planning density
  if (dimensions.planningDensity > 0.7) {
    parts.push("tends to create detailed, task-rich plans");
  } else if (dimensions.planningDensity < 0.3) {
    parts.push("tends to prefer lighter, focused plans");
  }
  
  // Execution follow-through
  if (dimensions.executionFollowThrough > 0.7) {
    parts.push("consistently completes most planned tasks");
  } else if (dimensions.executionFollowThrough < 0.3) {
    parts.push("often starts more tasks than finishes");
  }
  
  // Adjustment behavior
  if (dimensions.adjustmentBehavior > 0.7) {
    parts.push("frequently adjusts plans mid-cycle");
  } else if (dimensions.adjustmentBehavior < 0.3) {
    parts.push("maintains steady task schedules");
  }
  
  // Cadence
  if (dimensions.cadencePreference < 0.3) {
    parts.push("works primarily in the morning hours");
  } else if (dimensions.cadencePreference > 0.7) {
    parts.push("works at varied times throughout the day");
  }
  
  if (parts.length === 0) {
    return `Based on ${planCount} completed plans, this person shows balanced working patterns across all dimensions.`;
  }
  
  const pattern = parts.join(" and ");
  return `Based on ${planCount} completed plans, this person ${pattern}.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dimensions, metrics } = await req.json() as RequestPayload;
    
    if (!dimensions || !metrics) {
      return new Response(
        JSON.stringify({ error: "Missing dimensions or metrics" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // If no API key, use template-based summary
    if (!LOVABLE_API_KEY) {
      console.log("No LOVABLE_API_KEY, using template summary");
      const summary = generateTemplateSummary(dimensions, metrics.totalPlans);
      return new Response(
        JSON.stringify({ summary, source: "template" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt for AI
    const systemPrompt = `You are an observational analyst. Your responses must be:
- Strictly observational (describe what IS, not what SHOULD BE)
- Neutral tone (no good/bad, no judgment, no praise)
- 1-2 sentences maximum
- No advice, recommendations, or suggestions
- No commands or imperatives
- No motivational language

Example good responses:
- "This person tends to work through tasks early in the day and maintains detailed plans."
- "Completion patterns show variable timing throughout the day with frequent mid-plan adjustments."

Example bad responses:
- "Great job completing your tasks!" (praise)
- "You should try working in the morning." (advice)
- "Keep up the good work!" (motivational)`;

    const planningDesc = describeDimension(dimensions.planningDensity, "Light Planner", "Detailed Planner");
    const executionDesc = describeDimension(dimensions.executionFollowThrough, "Starter", "Finisher");
    const adjustmentDesc = describeDimension(dimensions.adjustmentBehavior, "Steady", "Adaptive");
    const cadenceDesc = describeDimension(dimensions.cadencePreference, "Morning Focus", "Variable Rhythm");

    const userPrompt = `Based on ${metrics.totalPlans} completed plans, describe this person's working patterns:
- Planning style: ${planningDesc} (avg ${metrics.avgTasksPerWeek.toFixed(1)} tasks/week)
- Execution follow-through: ${executionDesc} (${(metrics.avgCompletionRate * 100).toFixed(0)}% avg completion)
- Adjustment behavior: ${adjustmentDesc}
- Work cadence: ${cadenceDesc}

Write a brief, neutral observation. Be specific but not judgmental.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log("Rate limited, using template summary");
        const summary = generateTemplateSummary(dimensions, metrics.totalPlans);
        return new Response(
          JSON.stringify({ summary, source: "template" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.log("Payment required, using template summary");
        const summary = generateTemplateSummary(dimensions, metrics.totalPlans);
        return new Response(
          JSON.stringify({ summary, source: "template" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const summary = generateTemplateSummary(dimensions, metrics.totalPlans);
      return new Response(
        JSON.stringify({ summary, source: "template" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content?.trim();

    if (!aiSummary) {
      const summary = generateTemplateSummary(dimensions, metrics.totalPlans);
      return new Response(
        JSON.stringify({ summary, source: "template" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ summary: aiSummary, source: "ai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("operating-style-summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
