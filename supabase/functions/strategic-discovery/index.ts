import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types
interface DiscoveryAnswer {
  questionId: string;
  question: string;
  answer: string;
}

interface DiscoveryQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

interface StrategicContextProfile {
  decision_authority: 'high' | 'medium' | 'low';
  uncertainty_level: 'high' | 'medium' | 'low';
  dependency_density: 'high' | 'medium' | 'low';
  risk_tolerance: 'high' | 'medium' | 'low';
  time_sensitivity: 'high' | 'medium' | 'low';
  field: string;
}

interface RequestBody {
  field: string;
  answers: DiscoveryAnswer[];
  questionCount: number;
}

// Field-specific question guidance
const FIELD_GUIDANCE: Record<string, string> = {
  product_engineering: `Focus on: requirements clarity, technical dependencies, team coordination, delivery timelines, success metrics.`,
  marketing_growth: `Focus on: campaign scope, target metrics, budget constraints, vendor dependencies, market timing.`,
  operations: `Focus on: process scope, cross-team impact, documentation state, change management, risk tolerance.`,
  business_strategy: `Focus on: stakeholder alignment, investment level, market uncertainty, reversibility, competitive timing.`,
  leadership_executive: `Focus on: organizational scope, board/investor involvement, change magnitude, decision authority, priority conflicts.`,
  other: `Focus on: project clarity, dependencies, decision authority, time sensitivity, risk comfort.`,
};

// Maximum questions
const MAX_QUESTIONS = 8;
const IDEAL_QUESTIONS = 5;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field, answers, questionCount }: RequestBody = await req.json();

    // Validate input
    if (!field) {
      return new Response(
        JSON.stringify({ error: "Field is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we should stop
    if (questionCount > MAX_QUESTIONS) {
      return new Response(
        JSON.stringify({
          nextQuestion: null,
          isComplete: true,
          suggestedQuestionCount: questionCount - 1,
          contextProfile: deriveProfileFromAnswers(field, answers),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation context
    const answersContext = answers.length > 0
      ? answers.map((a, i) => `Q${i + 1}: "${a.question}" → Answer: "${a.answer}"`).join('\n')
      : 'No answers yet (this is the first question).';

    const systemPrompt = `You are a strategic planning discovery assistant. Your role is to ask SHORT, CONCRETE questions that help understand the user's problem space before they create a strategic plan.

FIELD: ${field}
${FIELD_GUIDANCE[field] || FIELD_GUIDANCE.other}

RULES:
1. Ask ONE question at a time
2. Questions must be field-specific and practical
3. Provide exactly 3 tap-based answer options (no long text input)
4. Avoid: hypotheticals, "why" chains, philosophical questions, open-ended questions
5. Never ask for confidential business data (revenue, specific customer names, etc.)
6. Stop when you have enough context to understand: uncertainty level, dependencies, decision authority, time sensitivity, and risk tolerance
7. Maximum ${MAX_QUESTIONS} questions - prioritize what matters most
8. Aim for ${IDEAL_QUESTIONS} questions if possible

GOOD question examples:
- "Does this work depend on other teams?"
- "Are the requirements clearly defined?"
- "Is success measured quantitatively or qualitatively?"
- "How costly are delays here?"
- "Do you have full decision authority?"

BAD question examples:
- "Why do you want to achieve this goal?"
- "What would happen if you failed?"
- "Describe your ideal outcome in detail"
- "What keeps you up at night about this?"

PREVIOUS ANSWERS:
${answersContext}

Based on the field and answers so far, either:
1. Generate the next most valuable question (if more clarity is needed)
2. Mark as complete and provide a context profile (if sufficient clarity exists)

Current question number: ${questionCount}`;

    // Call Lovable AI Gateway
    const gatewayUrl = Deno.env.get("AI_GATEWAY_URL") || "https://ai-gateway.lovable.dev";
    
    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "x-project-id": Deno.env.get("SUPABASE_PROJECT_ID") || "",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the next discovery question or mark as complete." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "discovery_response",
            description: "Generate the next discovery question or mark discovery as complete with a context profile",
            parameters: {
              type: "object",
              properties: {
                isComplete: {
                  type: "boolean",
                  description: "Whether we have gathered enough context to understand the user's situation",
                },
                nextQuestion: {
                  type: "object",
                  description: "The next question to ask (required if isComplete is false)",
                  properties: {
                    id: { type: "string", description: "Unique question ID like 'q1', 'q2', etc." },
                    question: { type: "string", description: "The question text, short and concrete" },
                    options: {
                      type: "array",
                      description: "Exactly 3 answer options",
                      items: {
                        type: "object",
                        properties: {
                          value: { type: "string", description: "Short value key" },
                          label: { type: "string", description: "Human-readable option text" },
                        },
                        required: ["value", "label"],
                      },
                    },
                  },
                  required: ["id", "question", "options"],
                },
                contextProfile: {
                  type: "object",
                  description: "Strategic context profile derived from answers (required if isComplete is true)",
                  properties: {
                    decision_authority: { type: "string", enum: ["high", "medium", "low"] },
                    uncertainty_level: { type: "string", enum: ["high", "medium", "low"] },
                    dependency_density: { type: "string", enum: ["high", "medium", "low"] },
                    risk_tolerance: { type: "string", enum: ["high", "medium", "low"] },
                    time_sensitivity: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["decision_authority", "uncertainty_level", "dependency_density", "risk_tolerance", "time_sensitivity"],
                },
                suggestedQuestionCount: {
                  type: "number",
                  description: "Estimated total number of questions needed (usually 5-6)",
                },
              },
              required: ["isComplete", "suggestedQuestionCount"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "discovery_response" } },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      // Return a fallback response
      return new Response(
        JSON.stringify({
          nextQuestion: null,
          isComplete: true,
          suggestedQuestionCount: questionCount,
          contextProfile: deriveProfileFromAnswers(field, answers),
          error: "AI unavailable, using fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", aiResponse);
      return new Response(
        JSON.stringify({
          nextQuestion: null,
          isComplete: true,
          suggestedQuestionCount: questionCount,
          contextProfile: deriveProfileFromAnswers(field, answers),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Add field to context profile if complete
    if (result.isComplete && result.contextProfile) {
      result.contextProfile.field = field;
    }

    return new Response(
      JSON.stringify({
        nextQuestion: result.nextQuestion || null,
        isComplete: result.isComplete,
        suggestedQuestionCount: result.suggestedQuestionCount || IDEAL_QUESTIONS,
        contextProfile: result.contextProfile || undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Strategic discovery error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        nextQuestion: null,
        isComplete: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Derive a basic context profile from answers when AI fails
 */
function deriveProfileFromAnswers(field: string, answers: DiscoveryAnswer[]): StrategicContextProfile {
  const profile: StrategicContextProfile = {
    decision_authority: 'medium',
    uncertainty_level: 'medium',
    dependency_density: 'medium',
    risk_tolerance: 'medium',
    time_sensitivity: 'medium',
    field,
  };

  for (const answer of answers) {
    const q = answer.question.toLowerCase();
    const a = answer.answer.toLowerCase();

    // Decision authority
    if (q.includes('authority') || q.includes('decision') || q.includes('approval')) {
      if (a.includes('full') || a.includes('yes') || a.includes('high')) {
        profile.decision_authority = 'high';
      } else if (a.includes('limited') || a.includes('no') || a.includes('require')) {
        profile.decision_authority = 'low';
      }
    }

    // Uncertainty
    if (q.includes('defined') || q.includes('clear') || q.includes('requirement') || q.includes('uncertain')) {
      if (a.includes('unclear') || a.includes('discover') || a.includes('partial') || a.includes('high')) {
        profile.uncertainty_level = 'high';
      } else if (a.includes('clear') || a.includes('fully') || a.includes('well') || a.includes('low')) {
        profile.uncertainty_level = 'low';
      }
    }

    // Dependencies
    if (q.includes('depend') || q.includes('team') || q.includes('coordination')) {
      if (a.includes('heavy') || a.includes('many') || a.includes('significant') || a.includes('yes')) {
        profile.dependency_density = 'high';
      } else if (a.includes('no') || a.includes('independent') || a.includes('minimal')) {
        profile.dependency_density = 'low';
      }
    }

    // Risk
    if (q.includes('risk') || q.includes('reversible') || q.includes('tolerance')) {
      if (a.includes('high') || a.includes('can take') || a.includes('easily') || a.includes('comfortable')) {
        profile.risk_tolerance = 'high';
      } else if (a.includes('low') || a.includes('averse') || a.includes('cautious') || a.includes('no')) {
        profile.risk_tolerance = 'low';
      }
    }

    // Time sensitivity
    if (q.includes('time') || q.includes('deadline') || q.includes('urgent') || q.includes('delay')) {
      if (a.includes('urgent') || a.includes('critical') || a.includes('yes') || a.includes('costly') || a.includes('high')) {
        profile.time_sensitivity = 'high';
      } else if (a.includes('flexible') || a.includes('no') || a.includes('soft') || a.includes('low')) {
        profile.time_sensitivity = 'low';
      }
    }
  }

  return profile;
}
