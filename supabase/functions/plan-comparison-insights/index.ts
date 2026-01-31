import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlanMetrics {
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  totalTimeSeconds: number;
  isStrategic: boolean;
  title?: string;
}

interface ComparisonDeltas {
  taskCount: number;
  completionRate: number;
  totalTime: number;
}

interface RequestBody {
  current: PlanMetrics;
  previous: PlanMetrics & { id: string };
  deltas: ComparisonDeltas;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { current, previous, deltas } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are analyzing two productivity plans to generate brief, observational insights. 

CURRENT PLAN:
- Total tasks: ${current.totalTasks}
- Completed: ${current.completedTasks} (${current.completionPercent}%)
- Time spent: ${Math.round(current.totalTimeSeconds / 60)} minutes
- Mode: ${current.isStrategic ? 'Strategic' : 'Standard'}

PREVIOUS PLAN (${previous.title || 'Previous'}):
- Total tasks: ${previous.totalTasks}
- Completed: ${previous.completedTasks} (${previous.completionPercent}%)
- Time spent: ${Math.round(previous.totalTimeSeconds / 60)} minutes
- Mode: ${previous.isStrategic ? 'Strategic' : 'Standard'}

CHANGES:
- Task count: ${deltas.taskCount > 0 ? '+' : ''}${deltas.taskCount}
- Completion rate: ${deltas.completionRate > 0 ? '+' : ''}${deltas.completionRate}%
- Time difference: ${Math.round(deltas.totalTime / 60)} minutes

Generate 2-3 SHORT observational insights (1 sentence each). 

RULES:
- Be observational, not prescriptive (no "you should" or "try to")
- Focus on what changed, not what to do next
- Use neutral, professional language
- If one plan performed better, note it factually
- If strategic mode was adopted, mention if it correlates with any change

Examples of good observations:
- "Fewer tasks correlated with higher completion rate"
- "Execution time increased despite similar task count"
- "Strategic planning mode coincided with more consistent pacing"

Respond with JSON: { "observations": ["observation1", "observation2"], "pattern_note": "optional note if clear pattern" }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a productivity analyst providing brief, neutral observations. Never give advice or commands. Output valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from response
    let parsed;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      // Fallback if parsing fails
      parsed = {
        observations: ["Comparison data available for review"],
        pattern_note: null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("plan-comparison-insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        observations: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
