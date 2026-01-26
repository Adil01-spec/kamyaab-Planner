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

// Validate strategic plan structure
function validateStrategicPlan(planJson: any): { valid: boolean; error?: string } {
  // First validate standard task structure
  const taskValidation = validateTaskExplanations(planJson);
  if (!taskValidation.valid) {
    return taskValidation;
  }

  // If marked as strategic, validate strategic fields
  if (planJson.is_strategic_plan) {
    if (!planJson.strategy_overview?.objective) {
      return { valid: false, error: "Strategic plan missing strategy objective" };
    }
    // Milestones are optional but if present, should have required fields
    if (planJson.milestones) {
      for (const milestone of planJson.milestones) {
        if (!milestone.title || milestone.week === undefined) {
          return { valid: false, error: "Milestone missing title or week" };
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
      const baseTask = {
        title: task.title,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        completed: task.completed || false,
        execution_state: 'pending',
        execution_status: 'idle',
        execution_started_at: null,
        time_spent_seconds: 0,
        // Preserve milestone reference for strategic plans
        ...(task.milestone && { milestone: task.milestone }),
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
            why: task.explanation.why || task.explanation.explanation || "",
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

    // Check if this is an executive profile (legacy strategic planning)
    const strategicPlanning = profile.strategicPlanning;
    const isExecutive = strategicPlanning && Object.keys(strategicPlanning).length > 0;

    // NEW: Check for Phase 8.1 strategic planning context
    const planContext = profile.professionDetails?.plan_context;
    const isStrategicMode = planContext?.strategic_mode === true;

    // Adjust weeks based on strategic horizon if provided (legacy or new)
    if (isExecutive && strategicPlanning.strategy_horizon) {
      const horizonWeeks: Record<string, number> = {
        '30_days': 4,
        '90_days': 12,
        '6_months': 24,
        '12_months': 52,
        '3_5_years': 52,
      };
      weeksRemaining = horizonWeeks[strategicPlanning.strategy_horizon] || weeksRemaining;
    } else if (isStrategicMode && planContext.time_horizon) {
      const horizonWeeks: Record<string, number> = {
        '30_days': 4,
        '90_days': 12,
        '6_months': 24,
        '12_months': 52,
      };
      weeksRemaining = horizonWeeks[planContext.time_horizon] || weeksRemaining;
    }

    // ============================================
    // STANDARD PLANNING PROMPTS (unchanged)
    // ============================================
    const baseSystemPrompt = `You are an expert productivity coach and project planner. You create deeply actionable plans with clear guidance.

CRITICAL RULES:
1. Every task MUST have detailed explanations - no exceptions
2. Never generate vague or shallow tasks
3. Prefer fewer, deeper tasks over many shallow ones
4. If you cannot explain HOW to do a task, do not include it
5. Your response MUST be valid JSON only. No markdown, no code blocks.`;

    const executiveSystemPrompt = `You are an elite executive coach and strategic advisor. You create high-leverage plans for founders, CEOs, and senior leaders.

CRITICAL RULES FOR EXECUTIVE PLANNING:
1. Focus on STRATEGIC MILESTONES, not micro-tasks
2. Each task should be a high-impact decision or delegation point
3. Include "What NOT to do" notes to prevent distraction
4. Suggest delegation where appropriate
5. Focus on leverage - what moves the needle most?
6. Consider the executive's decision-making style and constraints
7. Your response MUST be valid JSON only. No markdown, no code blocks.

EXECUTIVE PLANNING PRINCIPLES:
- Strategy over execution
- Delegation over doing
- Decisions over tasks
- Outcomes over activities
- Weekly themes over daily checklists`;

    // ============================================
    // NEW: STRATEGIC MODE PROMPT (Phase 8.2)
    // ============================================
    const strategicModeSystemPrompt = `You are a strategic planning expert. You help users plan at a high level by thinking in this strict order:
1. STRATEGY OVERVIEW - What are we trying to achieve and why now?
2. ASSUMPTIONS & RISKS - What are we betting on? What could go wrong?
3. MILESTONES - What are the key checkpoints that prove progress?
4. TASKS - What actions support each milestone?

CRITICAL RULES FOR STRATEGIC MODE:
1. Think STRATEGY FIRST, then derive tasks from milestones
2. Each milestone should have a clear outcome and timeframe
3. Tasks should explicitly link to milestones
4. Include assumptions - be honest about what you're assuming
5. Identify risks with mitigations
6. Your response MUST be valid JSON only. No markdown, no code blocks, no prose.

STRATEGIC PLANNING PRINCIPLES:
- Milestones drive tasks, not the other way around
- Make assumptions explicit
- Identify risks early
- Focus on outcomes, not activities`;

    // Build strategic context for the new strategic mode
    const buildStrategicContextBlock = () => {
      if (!isStrategicMode || !planContext) return '';

      const seniorityMap: Record<string, string> = {
        'individual_contributor': 'Individual Contributor',
        'manager': 'Manager',
        'director': 'Director',
        'vp_head': 'VP / Head',
        'founder_owner': 'Founder / Owner',
      };

      const scopeMap: Record<string, string> = {
        'personal': 'Personal execution',
        'team': 'Team initiative',
        'department': 'Department-level strategy',
        'company': 'Company-wide initiative',
      };

      const horizonMap: Record<string, string> = {
        '30_days': '30 days',
        '90_days': '90 days',
        '6_months': '6 months',
        '12_months': '12 months',
      };

      // Phase 8.10: Strategic Discovery Profile
      const discoveryProfile = planContext.strategic_context_profile;
      const discoveryContextBlock = discoveryProfile ? `
STRATEGIC DISCOVERY PROFILE (from discovery questions):
- Decision Authority: ${discoveryProfile.decision_authority} (${discoveryProfile.decision_authority === 'high' ? 'Full autonomy to make decisions' : discoveryProfile.decision_authority === 'low' ? 'Requires approvals for key decisions' : 'Shared decision-making process'})
- Uncertainty Level: ${discoveryProfile.uncertainty_level} (${discoveryProfile.uncertainty_level === 'high' ? 'Many unknowns, exploratory work' : discoveryProfile.uncertainty_level === 'low' ? 'Clear requirements and scope' : 'Some unknowns to resolve'})
- Dependency Density: ${discoveryProfile.dependency_density} (${discoveryProfile.dependency_density === 'high' ? 'Heavy cross-team coordination needed' : discoveryProfile.dependency_density === 'low' ? 'Independent execution possible' : 'Some coordination required'})
- Risk Tolerance: ${discoveryProfile.risk_tolerance} (${discoveryProfile.risk_tolerance === 'high' ? 'Can take calculated risks' : discoveryProfile.risk_tolerance === 'low' ? 'Risk-averse, prefer safe approaches' : 'Balanced approach to risk'})
- Time Sensitivity: ${discoveryProfile.time_sensitivity} (${discoveryProfile.time_sensitivity === 'high' ? 'Urgent, time-critical' : discoveryProfile.time_sensitivity === 'low' ? 'Flexible timeline' : 'Moderate urgency'})
- Field: ${discoveryProfile.field?.replace('_', ' / ') || 'Not specified'}

Use this profile to:
- Adjust risk surfacing based on uncertainty and risk tolerance levels
- Consider dependencies when structuring milestones and task sequencing
- Account for decision authority when suggesting delegation or escalation
- Reflect time sensitivity in milestone pacing and buffer recommendations
- Tailor the strategy overview to the specific field context
` : '';

      return `
STRATEGIC CONTEXT (User-provided):
- Seniority: ${seniorityMap[planContext.planning_seniority] || 'Not specified'}
- Planning Scope: ${(planContext.planning_scope || []).map((s: string) => scopeMap[s] || s).join(', ') || 'Not specified'}
- Time Horizon: ${horizonMap[planContext.time_horizon] || 'Not specified'}
- Budget Constraint: ${planContext.constraints?.budget || 'Not specified'}
- Team Size: ${planContext.constraints?.team_size || 'Not specified'}
- Dependencies: ${planContext.constraints?.dependencies || 'Not specified'}
- Risk Tolerance: ${planContext.constraints?.risk_tolerance || 'Not specified'}
- Success Definition: ${planContext.success_definition || 'Not specified'}
${discoveryContextBlock}
Use this context to inform your strategic planning. If a field is "Not specified", make reasonable assumptions.`;
    };

    // Select system prompt based on mode
    let systemPrompt: string;
    if (isStrategicMode) {
      systemPrompt = strategicModeSystemPrompt;
    } else if (isExecutive) {
      systemPrompt = executiveSystemPrompt;
    } else {
      systemPrompt = baseSystemPrompt;
    }

    const deadlineContext = noDeadline 
      ? `- Deadline: None (open-ended project)
- Planning Approach: Focus on consistency, sustainable progress, and meaningful milestones
- Duration: Generate an 8-week rolling plan that can be extended`
      : `- Deadline: ${profile.projectDeadline}
- Days Remaining: ${daysRemaining}
- Weeks Remaining: ${weeksRemaining}`;

    // Build strategic context for executives (legacy)
    const legacyStrategicContext = isExecutive ? `
STRATEGIC CONTEXT:
- Time Horizon: ${strategicPlanning.strategy_horizon || 'Not specified'}
- Primary Objective: ${strategicPlanning.primary_objective === 'Other' ? strategicPlanning.primary_objective_other : strategicPlanning.primary_objective || 'Not specified'}
- Business Stage: ${strategicPlanning.business_stage || 'Not specified'}
- Key Constraints: ${(strategicPlanning.constraints || []).join(', ')}${strategicPlanning.constraints_other ? `, ${strategicPlanning.constraints_other}` : ''}
- Delegation Preference: ${strategicPlanning.delegation_preference || 'Not specified'}
- Decision Style: ${strategicPlanning.decision_style || 'Not specified'}
` : '';

    const standardPlanningRequirements = noDeadline
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

    const executivePlanningRequirements = `Requirements for EXECUTIVE STRATEGIC PLAN:
- Create ${Math.min(weeksRemaining, 12)} weeks of strategic planning
- Each week should have a STRATEGIC THEME (e.g., "Market Validation", "Team Alignment")
- Include 2-3 HIGH-LEVERAGE actions per week (not tasks, but strategic moves)
- Each action should include delegation suggestions if applicable
- Add "What to AVOID this week" notes to prevent scope creep
- Include decision checkpoints where key choices must be made
- Priority must be "Critical", "High", or "Medium" (no Low priority at executive level)
- Focus on the primary objective: ${strategicPlanning?.primary_objective || 'growth'}
- Account for constraints: ${(strategicPlanning?.constraints || []).join(', ') || 'none specified'}
- Match delegation style: ${strategicPlanning?.delegation_preference || 'balanced'}
- Include 3-5 strategic milestones
- Add 3-5 executive-level insights or reminders`;

    // NEW: Strategic mode requirements
    const strategicModeRequirements = `Requirements for STRATEGIC PLANNING MODE:
- Create ${Math.min(weeksRemaining, 12)} weeks of strategic planning
- FIRST define the strategy overview (objective, why now, success definition)
- THEN list 3-5 assumptions you're making
- THEN identify 3-5 risks with mitigations
- THEN define 3-5 milestones with clear outcomes and timeframes
- FINALLY derive 3-4 tasks per week that support the milestones
- Each task MUST reference which milestone it supports
- Priority must be "High", "Medium", or "Low"
- Add 3-5 strategic insights or motivational messages
- Tasks behave exactly like standard tasks (same execution flow)`;

    // Select planning requirements based on mode
    let planningRequirements: string;
    if (isStrategicMode) {
      planningRequirements = strategicModeRequirements;
    } else if (isExecutive) {
      planningRequirements = executivePlanningRequirements;
    } else {
      planningRequirements = standardPlanningRequirements;
    }

    // Build the strategic context block
    const strategicContextBlock = isStrategicMode ? buildStrategicContextBlock() : legacyStrategicContext;

    // ============================================
    // BUILD USER PROMPT
    // ============================================
    let userPrompt: string;

    if (isStrategicMode) {
      // NEW: Strategic mode prompt with structured output
      userPrompt = `Create a strategic project plan for:

PROFILE:
- Name: ${profile.fullName}
- Profession: ${profile.profession}
- Professional Details: ${JSON.stringify(profile.professionDetails)}

PROJECT:
- Title: ${profile.projectTitle}
- Description: ${profile.projectDescription}
${deadlineContext}
${strategicContextBlock}

Generate a JSON response with this EXACT structure for STRATEGIC PLANNING:

{
  "overview": "2-3 sentence summary of the strategic plan",
  "total_weeks": ${weeksRemaining},
  "is_open_ended": ${noDeadline},
  "is_strategic_plan": true,
  "strategy_overview": {
    "objective": "Clear statement of what we're trying to achieve",
    "why_now": "Why this timing matters - what's the urgency or opportunity?",
    "success_definition": "How we'll know we succeeded - measurable outcomes"
  },
  "assumptions": [
    "Key assumption 1 - what are we betting on?",
    "Key assumption 2"
  ],
  "risks": [
    { "risk": "What could go wrong", "mitigation": "How to handle it" }
  ],
  "milestones": [
    { 
      "title": "Milestone name", 
      "week": 3, 
      "outcome": "What success looks like when this is achieved",
      "timeframe": "Week 1-3"
    }
  ],
  "weeks": [
    {
      "week": 1,
      "focus": "Strategic theme for this week",
      "tasks": [
        {
          "title": "Clear, specific task derived from a milestone",
          "milestone": "Which milestone this task supports",
          "priority": "High",
          "estimated_hours": 4,
          "explanation": {
            "how": "Concrete step-by-step instructions on HOW to complete this task.",
            "why": "How this task connects to the milestone and overall strategy.",
            "expected_outcome": "What success looks like when this task is done."
          }
        }
      ]
    }
  ],
  "motivation": [
    "Strategic insight or motivational message"
  ]
}

${planningRequirements}

CRITICAL INSTRUCTIONS:
- Think STRATEGY FIRST: overview → assumptions → risks → milestones → tasks
- Every task MUST have the "explanation" object with "how", "why", and "expected_outcome"
- Every task MUST have a "milestone" field linking it to a milestone
- Do NOT generate vague tasks - each should be actionable and specific
- Milestones should have measurable outcomes
- Be honest about assumptions and risks

RESPOND WITH ONLY THE JSON OBJECT.`;
    } else {
      // Standard or Executive prompt (unchanged)
      userPrompt = `Create a detailed, actionable project plan for:

PROFILE:
- Name: ${profile.fullName}
- Profession: ${profile.profession}
- Professional Details: ${JSON.stringify(profile.professionDetails)}

PROJECT:
- Title: ${profile.projectTitle}
- Description: ${profile.projectDescription}
${deadlineContext}
${strategicContextBlock}
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
    }

    console.log("Generating plan for user:", user.id, "Strategic mode:", isStrategicMode, "Executive mode:", isExecutive);

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

    // Validate using appropriate validator
    const validation = isStrategicMode 
      ? validateStrategicPlan(planJson) 
      : validateTaskExplanations(planJson);
      
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

    console.log("Plan validated successfully, saving to database. Strategic mode:", isStrategicMode);

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
