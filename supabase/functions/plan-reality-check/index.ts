import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
  execution_state?: string;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface Milestone {
  title: string;
  week: number;
  outcome?: string;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  weeks: Week[];
  milestones?: Milestone[];
  is_strategic_plan?: boolean;
  strategy_overview?: {
    objective: string;
    why_now?: string;
    success_definition?: string;
  };
  assumptions?: string[];
  risks?: { risk: string; mitigation?: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plan } = await req.json() as { plan: PlanData };
    
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Plan data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isStrategic = plan.is_strategic_plan === true;
    
    // Build context for AI
    const totalTasks = plan.weeks.reduce((sum, w) => sum + w.tasks.length, 0);
    const completedTasks = plan.weeks.reduce((sum, w) => 
      sum + w.tasks.filter(t => t.execution_state === 'done' || t.completed).length, 0);
    const totalHours = plan.weeks.reduce((sum, w) => 
      sum + w.tasks.reduce((h, t) => h + (t.estimated_hours || 0), 0), 0);
    
    const tasksByPriority = {
      high: plan.weeks.flatMap(w => w.tasks.filter(t => t.priority === 'High')).length,
      medium: plan.weeks.flatMap(w => w.tasks.filter(t => t.priority === 'Medium')).length,
      low: plan.weeks.flatMap(w => w.tasks.filter(t => t.priority === 'Low')).length,
    };

    // Build the plan summary for analysis
    const planSummary = {
      overview: plan.overview,
      totalWeeks: plan.total_weeks,
      totalTasks,
      completedTasks,
      totalEstimatedHours: totalHours,
      tasksByPriority,
      weeklyBreakdown: plan.weeks.map(w => ({
        week: w.week,
        focus: w.focus,
        taskCount: w.tasks.length,
        tasks: w.tasks.map(t => ({
          title: t.title,
          priority: t.priority,
          hours: t.estimated_hours,
        })),
      })),
      milestones: plan.milestones?.map(m => ({
        title: m.title,
        week: m.week,
        outcome: m.outcome,
      })),
    };

    // Add strategic context if available
    const strategicContext = isStrategic ? {
      objective: plan.strategy_overview?.objective,
      whyNow: plan.strategy_overview?.why_now,
      successDefinition: plan.strategy_overview?.success_definition,
      assumptions: plan.assumptions,
      risks: plan.risks,
    } : null;

    // Build the system prompt based on plan type
    const systemPrompt = isStrategic 
      ? `You are a strategic planning advisor providing a critical reality check on productivity plans. 
Your analysis should be direct, honest, and professional - not motivational. 
Focus on identifying genuine risks and gaps, not validation.
For strategic plans, provide deep analysis including strategic blind spots.`
      : `You are a productivity plan reviewer providing a practical reality check.
Your analysis should be direct, honest, and professional - not motivational.
Focus on feasibility and key risks. Keep feedback concise and actionable.`;

    const userPrompt = `Analyze this productivity plan and provide a critical reality check.

PLAN SUMMARY:
${JSON.stringify(planSummary, null, 2)}

${strategicContext ? `STRATEGIC CONTEXT:
${JSON.stringify(strategicContext, null, 2)}` : ''}

Provide your analysis using the critique_plan function.`;

    // Define the tool for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "critique_plan",
          description: "Provide a structured critique of the productivity plan",
          parameters: {
            type: "object",
            properties: {
              feasibility: {
                type: "object",
                properties: {
                  assessment: { 
                    type: "string", 
                    enum: ["realistic", "challenging", "unrealistic"],
                    description: "Overall feasibility rating"
                  },
                  summary: { 
                    type: "string",
                    description: "2-3 sentence assessment of whether the plan is achievable"
                  },
                  concerns: { 
                    type: "array", 
                    items: { type: "string" },
                    description: isStrategic 
                      ? "List specific concerns about timeline, scope, or resources (3-5 items)"
                      : "List 1-2 key concerns if any"
                  },
                },
                required: ["assessment", "summary", "concerns"],
              },
              risk_signals: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signal: { type: "string", description: "Description of the risk" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["signal", "severity"],
                    },
                    description: isStrategic 
                      ? "Identify 3-6 potential failure points, dependency risks, or weak assumptions"
                      : "Identify 2-3 key risks"
                  },
                },
                required: ["items"],
              },
              focus_gaps: {
                type: "object",
                properties: {
                  items: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Missing high-impact work or over-detailed low-value tasks"
                  },
                  strategic_blind_spots: isStrategic ? { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Strategic areas that may be overlooked or underestimated"
                  } : undefined,
                },
                required: ["items"],
              },
              deprioritization_suggestions: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_or_area: { type: "string", description: "What could be delayed or simplified" },
                        reason: { type: "string", description: "Why it likely won't matter as much as planned" },
                      },
                      required: ["task_or_area", "reason"],
                    },
                    description: isStrategic 
                      ? "Suggest 2-4 items that could be delayed or simplified"
                      : "Suggest 1-2 items that could be deprioritized"
                  },
                },
                required: ["items"],
              },
            },
            required: ["feasibility", "risk_signals", "focus_gaps", "deprioritization_suggestions"],
          },
        },
      },
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools,
        tool_choice: { type: "function", function: { name: "critique_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract the function call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "critique_plan") {
      console.error("Unexpected AI response structure:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let critique;
    try {
      critique = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI critique" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add metadata
    const result = {
      ...critique,
      is_strategic: isStrategic,
      generated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ critique: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("plan-reality-check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
