import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize task structure to use nested explanation object
function normalizeTaskStructure(weeks: any[]): any[] {
  return weeks.map((week: any) => ({
    ...week,
    tasks: week.tasks.map((task: any) => {
      const baseTask = {
        title: task.title,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        completed: task.completed || false,
        execution_state: 'pending',
        execution_status: 'idle',
        execution_started_at: null,
        time_spent_seconds: 0,
      };

      // Already has nested structure
      if (task.explanation && typeof task.explanation === 'object') {
        return {
          ...baseTask,
          ...task,
          execution_state: 'pending',
          execution_status: 'idle',
          execution_started_at: null,
          time_spent_seconds: 0,
          explanation: {
            how: task.explanation.how || task.explanation.how_to || "",
            why: task.explanation.why || "",
            expected_outcome: task.explanation.expected_outcome || task.explanation.expectedOutcome || "",
          },
        };
      }

      // Convert flat structure to nested
      return {
        ...baseTask,
        explanation: {
          how: task.how_to || "",
          why: task.explanation || "",
          expected_outcome: task.expected_outcome || "",
        },
      };
    })
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile, existingPlan, weeksToAdd = 4 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentWeeks = existingPlan.weeks?.length || 0;
    const startWeek = currentWeeks + 1;
    const endWeek = currentWeeks + weeksToAdd;

    // Get completed task summary for context
    const completedTasks = existingPlan.weeks?.flatMap((week: any) => 
      week.tasks.filter((t: any) => t.completed).map((t: any) => t.title)
    ) || [];

    const pendingTasks = existingPlan.weeks?.flatMap((week: any) => 
      week.tasks.filter((t: any) => !t.completed).map((t: any) => t.title)
    ) || [];

    const systemPrompt = `You are an expert productivity coach extending an existing project plan.
You create deeply actionable plans with clear guidance for every task.

CRITICAL RULES:
1. Every task MUST have the explanation object with how, why, and expected_outcome
2. Never generate vague or shallow tasks
3. Prefer fewer, deeper tasks over many shallow ones
4. Your response MUST be valid JSON only. No markdown, no code blocks.`;

    const userPrompt = `Extend an existing project plan with ${weeksToAdd} additional weeks.

PROFILE:
- Name: ${profile.fullName}
- Profession: ${profile.profession}
- Professional Details: ${JSON.stringify(profile.professionDetails)}

PROJECT:
- Title: ${profile.projectTitle}
- Description: ${profile.projectDescription}
- Type: Open-ended (no hard deadline)

CURRENT PROGRESS:
- Existing weeks: ${currentWeeks}
- Completed tasks: ${completedTasks.slice(0, 10).join(", ") || "None yet"}
- Pending tasks: ${pendingTasks.slice(0, 5).join(", ") || "None"}

EXISTING PLAN OVERVIEW: ${existingPlan.overview}

Generate ONLY the NEW weeks (weeks ${startWeek} to ${endWeek}) as a JSON response with this EXACT structure:
{
  "new_weeks": [
    {
      "week": ${startWeek},
      "focus": "main focus for this week",
      "tasks": [
        {
          "title": "specific task title",
          "priority": "High",
          "estimated_hours": 4,
          "explanation": {
            "how": "Concrete step-by-step instructions on HOW to complete this task",
            "why": "Clear explanation of WHY this task matters to the project",
            "expected_outcome": "What success looks like when this task is done"
          }
        }
      ]
    }
  ],
  "new_milestones": [
    { "title": "milestone name", "week": ${startWeek} }
  ],
  "updated_overview": "Updated 2-3 sentence summary including the extension"
}

Requirements:
- Create exactly ${weeksToAdd} new weeks (numbered ${startWeek} to ${endWeek})
- Build upon the existing progress and pending work
- Each week should have 3-4 DEEP, well-explained tasks (quality over quantity)
- Every task MUST have the "explanation" object with "how", "why", and "expected_outcome"
- Do NOT generate vague tasks
- Priority must be "High", "Medium", or "Low"
- Include 1-2 new milestones for the extended period
- Keep the sustainable, non-rushed pace
- Update the overview to reflect the extended timeline

RESPOND WITH ONLY THE JSON OBJECT.`;

    console.log("Calling AI to extend plan...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received, parsing...");

    // Parse JSON from response
    let extensionJson;
    try {
      extensionJson = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        extensionJson = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          extensionJson = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from AI response");
        }
      }
    }

    // Validate required fields
    if (!extensionJson.new_weeks || !Array.isArray(extensionJson.new_weeks)) {
      throw new Error("Invalid extension structure");
    }

    // Normalize the new weeks to use nested explanation structure
    const normalizedNewWeeks = normalizeTaskStructure(extensionJson.new_weeks);

    // Merge with existing plan
    const updatedPlan = {
      ...existingPlan,
      overview: extensionJson.updated_overview || existingPlan.overview,
      total_weeks: currentWeeks + normalizedNewWeeks.length,
      weeks: [...existingPlan.weeks, ...normalizedNewWeeks],
      milestones: [
        ...(existingPlan.milestones || []),
        ...(extensionJson.new_milestones || [])
      ],
      is_open_ended: true,
    };

    // Save updated plan to database
    const { error: updateError } = await supabaseClient
      .from("plans")
      .update({ plan_json: updatedPlan })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    console.log("Plan extended successfully");

    return new Response(JSON.stringify({ plan: updatedPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extend-plan function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
