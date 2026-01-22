import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletedTaskMetric {
  weekIndex: number;
  taskIndex: number;
  title: string;
  estimatedHours: number;
  actualSeconds: number;
  completedAt: string;
  effort?: 'easy' | 'okay' | 'hard';
  variancePercent: number;
}

interface ExecutionMetrics {
  completedTasks: CompletedTaskMetric[];
  estimationAccuracy: {
    averageVariance: number;
    overestimatedCount: number;
    underestimatedCount: number;
    accurateCount: number;
    pattern: 'optimistic' | 'accurate' | 'pessimistic';
  };
  effortPatterns: {
    easyCount: number;
    okayCount: number;
    hardCount: number;
    hardTasksTimeRatio: number;
    totalWithFeedback: number;
  };
  completionVelocity: {
    tasksPerDay: number;
    averageTimePerTask: number;
    fastestTask: CompletedTaskMetric | null;
    slowestTask: CompletedTaskMetric | null;
  };
  totalTimeSpent: number;
  planProgress: number;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { metrics, execution_version }: { metrics: ExecutionMetrics; execution_version: string } = await req.json();

    if (!metrics || !metrics.completedTasks || metrics.completedTasks.length < 3) {
      return new Response(
        JSON.stringify({ error: "Insufficient data. Need at least 3 completed tasks with time tracking." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI
    const { completedTasks, estimationAccuracy, effortPatterns, completionVelocity, totalTimeSpent, planProgress } = metrics;

    const taskSummaries = completedTasks.slice(-10).map(t => 
      `- "${t.title}": estimated ${t.estimatedHours}h, took ${formatTime(t.actualSeconds)} (${t.variancePercent > 0 ? '+' : ''}${Math.round(t.variancePercent)}%)${t.effort ? `, felt ${t.effort}` : ''}`
    ).join('\n');

    const systemPrompt = `You are an execution analyst reviewing how a user performed on their productivity plan tasks. 
Your job is to identify patterns in their work habits and provide actionable, observational insights.

Tone: Calm, direct, non-judgmental. Not motivational or critical.
Focus: Behavioral patterns based on observed data only.
Goal: Help user understand their execution patterns to improve future cycles.

CRITICAL RULES:
- Do NOT mention motivation, discipline, or habits
- Do NOT compare to other users
- Do NOT speculate beyond the data
- Keep diagnosis brief and specific
- One clear adjustment, not a list`;

    const userPrompt = `Analyze this execution data from ${completedTasks.length} completed tasks:

**Time Estimation Pattern:** ${estimationAccuracy.pattern}
- Average variance: ${Math.round(estimationAccuracy.averageVariance)}% (positive = took longer than estimated)
- Accurate (within 20%): ${estimationAccuracy.accurateCount} tasks
- Underestimated time: ${estimationAccuracy.underestimatedCount} tasks
- Overestimated time: ${estimationAccuracy.overestimatedCount} tasks

**Effort Feedback:** (${effortPatterns.totalWithFeedback} tasks with feedback)
- Easy: ${effortPatterns.easyCount}
- Okay: ${effortPatterns.okayCount}  
- Hard: ${effortPatterns.hardCount}
- Time on hard tasks: ${Math.round(effortPatterns.hardTasksTimeRatio)}% of total

**Velocity:**
- Tasks per day: ${completionVelocity.tasksPerDay.toFixed(1)}
- Average time per task: ${formatTime(completionVelocity.averageTimePerTask)}
${completionVelocity.fastestTask ? `- Fastest (vs estimate): "${completionVelocity.fastestTask.title}" (${Math.round(completionVelocity.fastestTask.variancePercent)}%)` : ''}
${completionVelocity.slowestTask ? `- Slowest (vs estimate): "${completionVelocity.slowestTask.title}" (+${Math.round(completionVelocity.slowestTask.variancePercent)}%)` : ''}

**Overall:**
- Total time spent: ${formatTime(totalTimeSpent)}
- Plan progress: ${planProgress}%

**Recent tasks:**
${taskSummaries}

Provide:
1. General execution insights (patterns, strengths, bottlenecks)
2. Execution diagnosis with the PRIMARY execution mistake and ONE actionable adjustment for the next cycle`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "provide_execution_insights",
              description: "Provide structured insights about the user's task execution patterns",
              parameters: {
                type: "object",
                properties: {
                  time_estimation_insight: {
                    type: "object",
                    properties: {
                      pattern: { type: "string", enum: ["optimistic", "accurate", "pessimistic"] },
                      summary: { type: "string", description: "2-3 sentence observation about their estimation habits" },
                      recommendation: { type: "string", description: "One concrete suggestion to improve estimates" },
                    },
                    required: ["pattern", "summary", "recommendation"],
                  },
                  effort_distribution_insight: {
                    type: "object",
                    properties: {
                      pattern: { type: "string", enum: ["balanced", "struggle-heavy", "smooth-sailing"] },
                      summary: { type: "string", description: "2-3 sentence observation about effort distribution" },
                      observation: { type: "string", description: "Key observation about what types of tasks feel hard vs easy" },
                    },
                    required: ["pattern", "summary", "observation"],
                  },
                  productivity_patterns: {
                    type: "object",
                    properties: {
                      peak_performance: { type: "string", description: "When/how the user works best based on the data" },
                      bottlenecks: {
                        type: "array",
                        items: { type: "string" },
                        description: "1-3 things that seem to slow them down",
                      },
                      strengths: {
                        type: "array",
                        items: { type: "string" },
                        description: "1-3 things they do well",
                      },
                    },
                    required: ["peak_performance", "bottlenecks", "strengths"],
                  },
                  forward_suggestion: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short actionable title (5-10 words)" },
                      detail: { type: "string", description: "2-3 sentences explaining the suggestion" },
                    },
                    required: ["title", "detail"],
                  },
                  execution_diagnosis: {
                    type: "object",
                    description: "Diagnostic analysis of execution mistakes and adjustments for next cycle",
                    properties: {
                      has_sufficient_data: { 
                        type: "boolean", 
                        description: "Whether there is enough meaningful data to provide a reliable diagnosis" 
                      },
                      primary_mistake: {
                        type: "object",
                        description: "The single biggest execution inefficiency observed",
                        properties: {
                          label: { type: "string", description: "Short label like 'Systematic underestimation' or 'Context switching overload'" },
                          detail: { type: "string", description: "One sentence explaining the issue with specific data, e.g. 'You spent ~35% more time than planned on setup-heavy tasks, delaying execution momentum.'" },
                        },
                        required: ["label", "detail"],
                      },
                      secondary_pattern: {
                        type: "object",
                        description: "Optional reinforcing behavior pattern. Only include if statistically meaningful.",
                        properties: {
                          label: { type: "string" },
                          detail: { type: "string" },
                        },
                        required: ["label", "detail"],
                      },
                      adjustment: {
                        type: "object",
                        description: "One clear, actionable change for the next plan cycle",
                        properties: {
                          action: { type: "string", description: "Specific action like 'Increase buffer for research tasks by 30%' or 'Cap daily execution to 3 tasks'" },
                        },
                        required: ["action"],
                      },
                    },
                    required: ["has_sufficient_data", "primary_mistake", "adjustment"],
                  },
                },
                required: ["time_estimation_insight", "effort_distribution_insight", "productivity_patterns", "forward_suggestion", "execution_diagnosis"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_execution_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        insights: {
          ...insights,
          generated_at: new Date().toISOString(),
          execution_version,
          tasks_analyzed: completedTasks.length,
          total_time_formatted: formatTime(totalTimeSpent),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Execution insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
