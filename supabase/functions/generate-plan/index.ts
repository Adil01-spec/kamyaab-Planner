import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate that every task has required explanation fields
function validateTaskExplanations(planJson: any): { valid: boolean; error?: string } {
  if (!planJson.weeks || !Array.isArray(planJson.weeks)) {
    return { valid: false, error: "Missing weeks array" };
  }

  for (const week of planJson.weeks) {
    if (!week.tasks || !Array.isArray(week.tasks)) {
      return { valid: false, error: `Week ${week.week} has no tasks` };
    }

    for (const task of week.tasks) {
      if (!task.title) {
        return { valid: false, error: `Task in week ${week.week} missing title` };
      }
      
      // Check for nested explanation structure
      if (task.explanation && typeof task.explanation === 'object') {
        if (!task.explanation.how || !task.explanation.why || !task.explanation.expected_outcome) {
          return { 
            valid: false, 
            error: `Task "${task.title}" in week ${week.week} has incomplete explanation object` 
          };
        }
      } 
      // Check for flat structure (backward compat during transition)
      else if (!task.explanation || !task.how_to || !task.expected_outcome) {
        // Try to accept nested OR flat structure
        const hasNestedExplanation = task.explanation && typeof task.explanation === 'object';
        const hasFlatExplanation = task.explanation && task.how_to && task.expected_outcome;
        
        if (!hasNestedExplanation && !hasFlatExplanation) {
          return { 
            valid: false, 
            error: `Task "${task.title}" in week ${week.week} missing explanation fields. Tasks must have clear guidance.` 
          };
        }
      }
    }
  }

  return { valid: true };
}

// Normalize task structure to use nested explanation object
function normalizeTaskStructure(planJson: any): any {
  if (!planJson.weeks) return planJson;

  const normalizedWeeks = planJson.weeks.map((week: any) => ({
    ...week,
    tasks: week.tasks.map((task: any) => {
      // Already has nested structure
      if (task.explanation && typeof task.explanation === 'object') {
        return {
          ...task,
          explanation: {
            how: task.explanation.how || task.explanation.how_to || "",
            why: task.explanation.why || task.explanation.explanation || "",
            expected_outcome: task.explanation.expected_outcome || task.explanation.expectedOutcome || ""
          }
        };
      }
      
      // Convert flat structure to nested
      return {
        title: task.title,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        completed: task.completed || false,
        explanation: {
          how: task.how_to || "",
          why: task.explanation || "",
          expected_outcome: task.expected_outcome || ""
        }
      };
    })
  }));

  return {
    ...planJson,
    weeks: normalizedWeeks
  };
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

    const { profile, retryCount = 0 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date();
    const noDeadline = profile.noDeadline === true || !profile.projectDeadline;
    
    let daysRemaining: number;
    let weeksRemaining: number;
    
    if (noDeadline) {
      weeksRemaining = 8;
      daysRemaining = weeksRemaining * 7;
    } else {
      const deadline = new Date(profile.projectDeadline);
      daysRemaining = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    }

    const systemPrompt = `You are an expert productivity coach and project planner. You create deeply actionable plans with clear guidance.

CRITICAL RULES:
1. Every task MUST have detailed explanations - no exceptions
2. Never generate vague or shallow tasks
3. Prefer fewer, deeper tasks over many shallow ones
4. If you cannot explain HOW to do a task, do not include it
5. Your response MUST be valid JSON only. No markdown, no code blocks.`;

    const deadlineContext = noDeadline 
      ? `- Deadline: None (open-ended project)
- Planning Approach: Focus on consistency, sustainable progress, and meaningful milestones
- Duration: Generate an 8-week rolling plan that can be extended`
      : `- Deadline: ${profile.projectDeadline}
- Days Remaining: ${daysRemaining}
- Weeks Remaining: ${weeksRemaining}`;

    const planningRequirements = noDeadline
      ? `Requirements for OPEN-ENDED project:
- Create ${weeksRemaining} weeks of planning (rolling, extendable)
- Focus on building consistent habits and sustainable momentum
- Each week should have 3-4 DEEP, well-explained tasks (quality over quantity)
- Priority must be "High", "Medium", or "Low"
- Include 3-5 meaningful milestones based on progress
- Add 3-5 motivational messages focused on consistency
- Make it realistic and achievable without burnout`
      : `Requirements:
- Create ${weeksRemaining} weeks of planning
- Each week should have 3-4 DEEP, well-explained tasks (quality over quantity)
- Priority must be "High", "Medium", or "Low"
- Include 3-5 key milestones
- Add 3-5 motivational messages
- Make it realistic and achievable`;

    const userPrompt = `Create a detailed, actionable project plan for:

PROFILE:
- Name: ${profile.fullName}
- Profession: ${profile.profession}
- Professional Details: ${JSON.stringify(profile.professionDetails)}

PROJECT:
- Title: ${profile.projectTitle}
- Description: ${profile.projectDescription}
${deadlineContext}

Generate a JSON response with this EXACT structure. Every task MUST have the nested explanation object:

{
  "overview": "2-3 sentence summary of the plan",
  "total_weeks": ${weeksRemaining},
  "is_open_ended": ${noDeadline},
  "milestones": [
    { "title": "milestone name", "week": 1 }
  ],
  "weeks": [
    {
      "week": 1,
      "focus": "main focus for this week",
      "tasks": [
        {
          "title": "Clear, specific task title",
          "priority": "High",
          "estimated_hours": 4,
          "explanation": {
            "how": "Concrete step-by-step instructions on HOW to complete this task. Be specific and actionable.",
            "why": "Clear explanation of WHY this task matters and how it contributes to the project goals.",
            "expected_outcome": "What success looks like. Describe the tangible result when this task is done."
          }
        }
      ]
    }
  ],
  "motivation": [
    "motivational quote or tip"
  ]
}

${planningRequirements}

CRITICAL INSTRUCTIONS:
- Every task MUST have the "explanation" object with "how", "why", and "expected_outcome" fields
- Do NOT generate vague tasks like "Work on project" or "Continue development"
- Each task should be specific enough that someone could start immediately
- The "how" field should contain 2-4 concrete steps
- The "why" field should connect the task to the bigger picture
- The "expected_outcome" should be measurable or observable

RESPOND WITH ONLY THE JSON OBJECT.`;

    console.log("Generating plan for user:", user.id);

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

    // Parse JSON from response
    let planJson;
    try {
      planJson = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        planJson = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          planJson = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from AI response");
        }
      }
    }

    // Validate required fields
    if (!planJson.overview || !planJson.weeks || !Array.isArray(planJson.weeks)) {
      throw new Error("Invalid plan structure");
    }

    // Normalize task structure to use nested explanation object
    planJson = normalizeTaskStructure(planJson);

    // Validate task explanations
    const validation = validateTaskExplanations(planJson);
    if (!validation.valid) {
      console.error("Plan validation failed:", validation.error);
      
      // Auto-retry once if validation fails
      if (retryCount < 1) {
        console.log("Retrying plan generation due to validation failure...");
        return new Response(
          JSON.stringify({ 
            error: "Planner failed to generate actionable steps. Retrying...",
            retry: true,
            retryCount: retryCount + 1
          }), 
          { 
            status: 422, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`Plan validation failed: ${validation.error}`);
    }

    console.log("Plan validated successfully, saving to database");

    // Save plan to database
    const { data: existingPlan } = await supabaseClient
      .from("plans")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingPlan) {
      const { error: updateError } = await supabaseClient
        .from("plans")
        .update({ plan_json: planJson })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from("plans")
        .insert({ user_id: user.id, plan_json: planJson });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ plan: planJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-plan function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
