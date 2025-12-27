import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date();
    const noDeadline = profile.noDeadline === true || !profile.projectDeadline;
    
    let daysRemaining: number;
    let weeksRemaining: number;
    
    if (noDeadline) {
      // For open-ended projects, default to 8 weeks of planning
      weeksRemaining = 8;
      daysRemaining = weeksRemaining * 7;
    } else {
      const deadline = new Date(profile.projectDeadline);
      daysRemaining = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    }

    const systemPrompt = `You are an expert productivity coach and project planner. Generate actionable weekly plans.
Your response MUST be valid JSON only. No markdown, no explanations, no code blocks.`;

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
- Each week should have 3-5 manageable tasks
- Tasks should be specific and actionable with clear explanations
- Each task MUST include: title, priority, estimated_hours, explanation, how_to, and expected_outcome
- Priority must be "High", "Medium", or "Low"
- Include 3-5 meaningful milestones based on progress, not dates
- Add 3-5 motivational messages focused on consistency and growth
- Emphasize sustainable pace over urgency
- Make it realistic and achievable without burnout`
      : `Requirements:
- Create ${weeksRemaining} weeks of planning
- Each week should have 3-5 tasks
- Tasks should be specific and actionable with clear explanations
- Each task MUST include: title, priority, estimated_hours, explanation, how_to, and expected_outcome
- Priority must be "High", "Medium", or "Low"
- Include 3-5 key milestones
- Add 3-5 motivational messages
- Make it realistic and achievable`;

    const userPrompt = `Create a detailed project plan for:

PROFILE:
- Name: ${profile.fullName}
- Profession: ${profile.profession}
- Professional Details: ${JSON.stringify(profile.professionDetails)}

PROJECT:
- Title: ${profile.projectTitle}
- Description: ${profile.projectDescription}
${deadlineContext}

Generate a JSON response with this EXACT structure:
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
          "title": "specific task title",
          "priority": "High",
          "estimated_hours": 4,
          "explanation": "Why this task matters and how it contributes to the project goals",
          "how_to": "Step-by-step guidance on how to complete this task effectively",
          "expected_outcome": "What success looks like when this task is completed"
        }
      ]
    }
  ],
  "motivation": [
    "motivational quote or tip",
    "another motivational message"
  ]
}

${planningRequirements}

IMPORTANT: Every task MUST have all six fields (title, priority, estimated_hours, explanation, how_to, expected_outcome). Do not skip any field.

RESPOND WITH ONLY THE JSON OBJECT.`;

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

    // Parse JSON from response (handle potential markdown code blocks)
    let planJson;
    try {
      // Try direct parse first
      planJson = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        planJson = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the content
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
