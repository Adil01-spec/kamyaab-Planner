// ============================================
// Phase 8.10: Strategic Discovery Types & Constants
// ============================================

/**
 * Strategic field categories for discovery flow
 */
export type StrategicField = 
  | 'product_engineering'
  | 'marketing_growth'
  | 'operations'
  | 'business_strategy'
  | 'leadership_executive'
  | 'other';

export const STRATEGIC_FIELDS = [
  { value: 'product_engineering' as const, label: 'Product / Engineering', icon: 'Code' },
  { value: 'marketing_growth' as const, label: 'Marketing / Growth', icon: 'TrendingUp' },
  { value: 'operations' as const, label: 'Operations', icon: 'Settings' },
  { value: 'business_strategy' as const, label: 'Business / Strategy', icon: 'Target' },
  { value: 'leadership_executive' as const, label: 'Leadership / Executive', icon: 'Crown' },
  { value: 'other' as const, label: 'Other', icon: 'MoreHorizontal' },
] as const;

/**
 * Strategic Context Profile - derived from discovery answers
 * Internal use only (not shown to user by default)
 */
export interface StrategicContextProfile {
  decision_authority: 'high' | 'medium' | 'low';
  uncertainty_level: 'high' | 'medium' | 'low';
  dependency_density: 'high' | 'medium' | 'low';
  risk_tolerance: 'high' | 'medium' | 'low';
  time_sensitivity: 'high' | 'medium' | 'low';
  field: StrategicField;
}

/**
 * Discovery Question structure
 */
export interface DiscoveryQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

/**
 * Discovery Answer structure
 */
export interface DiscoveryAnswer {
  questionId: string;
  question: string;
  answer: string;
}

/**
 * Edge function response structure
 */
export interface DiscoveryResponse {
  nextQuestion: DiscoveryQuestion | null;
  isComplete: boolean;
  contextProfile?: StrategicContextProfile;
  suggestedQuestionCount: number;
  error?: string;
}

// ============================================
// Fallback Questions (used when AI fails)
// ============================================

/**
 * Fallback questions by field - used when edge function fails
 */
export const FALLBACK_QUESTIONS: Record<StrategicField, DiscoveryQuestion[]> = {
  product_engineering: [
    {
      id: 'pe_1',
      question: 'Are the requirements for this work clearly defined?',
      options: [
        { value: 'clear', label: 'Yes, fully defined' },
        { value: 'partial', label: 'Partially defined' },
        { value: 'unclear', label: 'Still being discovered' },
      ],
    },
    {
      id: 'pe_2',
      question: 'Does this work depend on other teams or systems?',
      options: [
        { value: 'none', label: 'No dependencies' },
        { value: 'some', label: 'Some coordination needed' },
        { value: 'heavy', label: 'Heavy cross-team work' },
      ],
    },
    {
      id: 'pe_3',
      question: 'How is success measured for this project?',
      options: [
        { value: 'quantitative', label: 'Clear metrics' },
        { value: 'qualitative', label: 'Quality/user feedback' },
        { value: 'mixed', label: 'Both' },
      ],
    },
    {
      id: 'pe_4',
      question: 'How costly would delays be?',
      options: [
        { value: 'high', label: 'Very costly' },
        { value: 'medium', label: 'Moderate impact' },
        { value: 'low', label: 'Flexible timeline' },
      ],
    },
    {
      id: 'pe_5',
      question: 'Do you have full decision authority on this work?',
      options: [
        { value: 'full', label: 'Yes, full authority' },
        { value: 'shared', label: 'Shared decisions' },
        { value: 'limited', label: 'Requires approvals' },
      ],
    },
  ],
  marketing_growth: [
    {
      id: 'mg_1',
      question: 'Is this a new initiative or optimization of existing work?',
      options: [
        { value: 'new', label: 'New initiative' },
        { value: 'optimization', label: 'Optimizing existing' },
        { value: 'both', label: 'Mix of both' },
      ],
    },
    {
      id: 'mg_2',
      question: 'How clear are the target metrics?',
      options: [
        { value: 'clear', label: 'Well-defined KPIs' },
        { value: 'partial', label: 'Some metrics set' },
        { value: 'unclear', label: 'Still defining success' },
      ],
    },
    {
      id: 'mg_3',
      question: 'Does this require external vendor coordination?',
      options: [
        { value: 'no', label: 'Internal only' },
        { value: 'some', label: 'Some vendor work' },
        { value: 'heavy', label: 'Heavy vendor dependency' },
      ],
    },
    {
      id: 'mg_4',
      question: 'Is there budget flexibility?',
      options: [
        { value: 'flexible', label: 'Yes, flexible' },
        { value: 'fixed', label: 'Fixed budget' },
        { value: 'uncertain', label: 'Budget TBD' },
      ],
    },
    {
      id: 'mg_5',
      question: 'How time-sensitive is this campaign/initiative?',
      options: [
        { value: 'urgent', label: 'Urgent deadline' },
        { value: 'moderate', label: 'Moderate urgency' },
        { value: 'flexible', label: 'Flexible timing' },
      ],
    },
  ],
  operations: [
    {
      id: 'op_1',
      question: 'Is this process improvement or new capability?',
      options: [
        { value: 'improvement', label: 'Improving existing' },
        { value: 'new', label: 'New capability' },
        { value: 'both', label: 'Both' },
      ],
    },
    {
      id: 'op_2',
      question: 'How many teams/departments are affected?',
      options: [
        { value: 'one', label: 'Just my team' },
        { value: 'few', label: 'A few teams' },
        { value: 'many', label: 'Organization-wide' },
      ],
    },
    {
      id: 'op_3',
      question: 'Is the current state well-documented?',
      options: [
        { value: 'yes', label: 'Well documented' },
        { value: 'partial', label: 'Partially' },
        { value: 'no', label: 'Needs discovery' },
      ],
    },
    {
      id: 'op_4',
      question: 'What is the risk tolerance for this change?',
      options: [
        { value: 'high', label: 'Can take risks' },
        { value: 'medium', label: 'Moderate caution' },
        { value: 'low', label: 'Risk-averse' },
      ],
    },
    {
      id: 'op_5',
      question: 'Is there a hard deadline?',
      options: [
        { value: 'yes', label: 'Yes, fixed date' },
        { value: 'soft', label: 'Soft deadline' },
        { value: 'no', label: 'No specific deadline' },
      ],
    },
  ],
  business_strategy: [
    {
      id: 'bs_1',
      question: 'Is this a reactive or proactive strategic move?',
      options: [
        { value: 'proactive', label: 'Proactive opportunity' },
        { value: 'reactive', label: 'Responding to change' },
        { value: 'both', label: 'Mix of both' },
      ],
    },
    {
      id: 'bs_2',
      question: 'How much stakeholder alignment exists?',
      options: [
        { value: 'aligned', label: 'Fully aligned' },
        { value: 'partial', label: 'Partial alignment' },
        { value: 'building', label: 'Building consensus' },
      ],
    },
    {
      id: 'bs_3',
      question: 'What level of investment is required?',
      options: [
        { value: 'significant', label: 'Significant resources' },
        { value: 'moderate', label: 'Moderate investment' },
        { value: 'minimal', label: 'Minimal resources' },
      ],
    },
    {
      id: 'bs_4',
      question: 'How much market uncertainty exists?',
      options: [
        { value: 'high', label: 'High uncertainty' },
        { value: 'medium', label: 'Some unknowns' },
        { value: 'low', label: 'Clear landscape' },
      ],
    },
    {
      id: 'bs_5',
      question: 'Is this reversible if it doesn\'t work?',
      options: [
        { value: 'yes', label: 'Easily reversible' },
        { value: 'partial', label: 'Partially reversible' },
        { value: 'no', label: 'Significant commitment' },
      ],
    },
  ],
  leadership_executive: [
    {
      id: 'le_1',
      question: 'What is the scope of this initiative?',
      options: [
        { value: 'company', label: 'Company-wide' },
        { value: 'department', label: 'Department/division' },
        { value: 'team', label: 'Team-level' },
      ],
    },
    {
      id: 'le_2',
      question: 'Is board/investor alignment needed?',
      options: [
        { value: 'yes', label: 'Yes, critical' },
        { value: 'inform', label: 'Keep informed' },
        { value: 'no', label: 'Not required' },
      ],
    },
    {
      id: 'le_3',
      question: 'How much organizational change is involved?',
      options: [
        { value: 'significant', label: 'Major restructuring' },
        { value: 'moderate', label: 'Some changes' },
        { value: 'minimal', label: 'Minimal change' },
      ],
    },
    {
      id: 'le_4',
      question: 'What is the decision timeline?',
      options: [
        { value: 'urgent', label: 'Immediate decisions' },
        { value: 'quarter', label: 'This quarter' },
        { value: 'year', label: 'Longer horizon' },
      ],
    },
    {
      id: 'le_5',
      question: 'Are there competing priorities?',
      options: [
        { value: 'yes', label: 'Yes, significant' },
        { value: 'some', label: 'Some competing' },
        { value: 'no', label: 'This is top priority' },
      ],
    },
  ],
  other: [
    {
      id: 'ot_1',
      question: 'How well-defined is this project?',
      options: [
        { value: 'clear', label: 'Very clear' },
        { value: 'partial', label: 'Somewhat clear' },
        { value: 'unclear', label: 'Still exploring' },
      ],
    },
    {
      id: 'ot_2',
      question: 'Does this depend on others?',
      options: [
        { value: 'no', label: 'Independent work' },
        { value: 'some', label: 'Some dependencies' },
        { value: 'heavy', label: 'Heavy coordination' },
      ],
    },
    {
      id: 'ot_3',
      question: 'What is your decision authority?',
      options: [
        { value: 'full', label: 'Full authority' },
        { value: 'shared', label: 'Shared decisions' },
        { value: 'limited', label: 'Limited authority' },
      ],
    },
    {
      id: 'ot_4',
      question: 'How time-sensitive is this?',
      options: [
        { value: 'urgent', label: 'Very urgent' },
        { value: 'moderate', label: 'Moderate urgency' },
        { value: 'flexible', label: 'Flexible timeline' },
      ],
    },
    {
      id: 'ot_5',
      question: 'How comfortable are you with risk?',
      options: [
        { value: 'high', label: 'Can take risks' },
        { value: 'medium', label: 'Moderate risk' },
        { value: 'low', label: 'Risk-averse' },
      ],
    },
  ],
};

// ============================================
// Utility Functions
// ============================================

/**
 * Derive a basic context profile from fallback answers
 */
export function deriveContextProfileFromAnswers(
  field: StrategicField,
  answers: DiscoveryAnswer[]
): StrategicContextProfile {
  // Default profile
  const profile: StrategicContextProfile = {
    decision_authority: 'medium',
    uncertainty_level: 'medium',
    dependency_density: 'medium',
    risk_tolerance: 'medium',
    time_sensitivity: 'medium',
    field,
  };
  
  // Map answer patterns to profile dimensions
  for (const answer of answers) {
    const q = answer.question.toLowerCase();
    const a = answer.answer.toLowerCase();
    
    // Decision authority detection
    if (q.includes('authority') || q.includes('decision')) {
      if (a.includes('full') || a.includes('yes')) profile.decision_authority = 'high';
      else if (a.includes('limited') || a.includes('approval')) profile.decision_authority = 'low';
    }
    
    // Uncertainty detection
    if (q.includes('defined') || q.includes('clear') || q.includes('uncertainty')) {
      if (a.includes('unclear') || a.includes('discover') || a.includes('high') || a.includes('exploring')) {
        profile.uncertainty_level = 'high';
      } else if (a.includes('clear') || a.includes('fully') || a.includes('well') || a.includes('low')) {
        profile.uncertainty_level = 'low';
      }
    }
    
    // Dependency detection
    if (q.includes('depend') || q.includes('team') || q.includes('coordination')) {
      if (a.includes('heavy') || a.includes('many') || a.includes('organization')) {
        profile.dependency_density = 'high';
      } else if (a.includes('no') || a.includes('independent') || a.includes('just') || a.includes('one')) {
        profile.dependency_density = 'low';
      }
    }
    
    // Risk tolerance detection
    if (q.includes('risk') || q.includes('reversible')) {
      if (a.includes('high') || a.includes('can take') || a.includes('easily')) {
        profile.risk_tolerance = 'high';
      } else if (a.includes('low') || a.includes('averse') || a.includes('no') || a.includes('significant commitment')) {
        profile.risk_tolerance = 'low';
      }
    }
    
    // Time sensitivity detection
    if (q.includes('time') || q.includes('deadline') || q.includes('urgent') || q.includes('costly')) {
      if (a.includes('urgent') || a.includes('immediate') || a.includes('yes') || a.includes('very') || a.includes('high')) {
        profile.time_sensitivity = 'high';
      } else if (a.includes('flexible') || a.includes('no') || a.includes('soft') || a.includes('low')) {
        profile.time_sensitivity = 'low';
      }
    }
  }
  
  return profile;
}

/**
 * Get human-readable label for a profile dimension value
 */
export function getProfileDimensionLabel(
  dimension: keyof Omit<StrategicContextProfile, 'field'>,
  value: 'high' | 'medium' | 'low'
): string {
  const labels: Record<typeof dimension, Record<typeof value, string>> = {
    decision_authority: {
      high: 'Full autonomy',
      medium: 'Shared decision-making',
      low: 'Requires approvals',
    },
    uncertainty_level: {
      high: 'Many unknowns, exploratory',
      medium: 'Some unknowns',
      low: 'Clear requirements',
    },
    dependency_density: {
      high: 'Heavy coordination needed',
      medium: 'Some dependencies',
      low: 'Independent execution',
    },
    risk_tolerance: {
      high: 'Can take risks',
      medium: 'Balanced approach',
      low: 'Risk-averse',
    },
    time_sensitivity: {
      high: 'Urgent',
      medium: 'Moderate urgency',
      low: 'Flexible timeline',
    },
  };
  
  return labels[dimension][value];
}

/**
 * Get field label from value
 */
export function getFieldLabel(field: StrategicField): string {
  const found = STRATEGIC_FIELDS.find(f => f.value === field);
  return found?.label || 'Other';
}
