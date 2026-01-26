// Executive profile detection utilities

export const EXECUTIVE_PROFESSIONS = ['business_owner', 'executive'];

export const EXECUTIVE_KEYWORDS = [
  'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cio',
  'vp', 'vice president',
  'director', 'head of', 'founder', 'co-founder',
  'president', 'chief', 'executive', 'managing director',
  'partner', 'principal', 'owner'
];

export const EXECUTIVE_ROLES = [
  'CEO / Chief Executive Officer',
  'CTO / Chief Technology Officer',
  'COO / Chief Operating Officer',
  'CFO / Chief Financial Officer',
  'CMO / Chief Marketing Officer',
  'VP / Vice President',
  'Director',
  'Head of Department',
  'Founder / Co-Founder',
  'Managing Director',
  'Partner / Principal',
  'General Manager',
  'Other Executive Role',
];

export function isExecutiveProfile(
  profession: string,
  professionDetails?: Record<string, any>
): boolean {
  // Check if profession is explicitly business owner
  if (EXECUTIVE_PROFESSIONS.includes(profession)) {
    return true;
  }

  // Check profession details for executive keywords
  const detailsStr = JSON.stringify(professionDetails || {}).toLowerCase();
  for (const keyword of EXECUTIVE_KEYWORDS) {
    if (detailsStr.includes(keyword)) {
      return true;
    }
  }

  // Check profession string itself
  const professionLower = profession.toLowerCase();
  for (const keyword of EXECUTIVE_KEYWORDS) {
    if (professionLower.includes(keyword)) {
      return true;
    }
  }

  return false;
}

// Strategic planning field definitions (for executives via collapsible section)
export interface StrategicPlanningData {
  strategy_horizon?: '30_days' | '90_days' | '6_months' | '12_months' | '3_5_years';
  primary_objective?: string;
  primary_objective_other?: string;
  business_stage?: string;
  constraints?: string[];
  constraints_other?: string;
  delegation_preference?: string;
  decision_style?: string;
}

export const STRATEGY_HORIZONS = [
  { value: '30_days', label: '30 days (tactical)' },
  { value: '90_days', label: '90 days (execution)' },
  { value: '6_months', label: '6 months (growth)' },
  { value: '12_months', label: '12 months (strategy)' },
  { value: '3_5_years', label: '3–5 years (vision)' },
];

export const PRIMARY_OBJECTIVES = [
  'Revenue Growth',
  'Cost Optimization',
  'Market Expansion',
  'Team Scaling',
  'Product Innovation',
  'Brand Positioning',
  'Operational Excellence',
  'Other',
];

export const BUSINESS_STAGES = [
  'Idea / Pre-revenue',
  'Early revenue',
  'Growth',
  'Scaling',
  'Mature',
  'Turnaround / Restructuring',
];

export const CONSTRAINTS = [
  'Time',
  'Capital',
  'Talent',
  'Technology',
  'Market uncertainty',
  'Regulation',
  'Personal bandwidth',
];

export const DELEGATION_PREFERENCES = [
  'Fully hands-on',
  'Partially delegated',
  'Mostly strategic',
  'Fully strategic (oversight only)',
];

export const DECISION_STYLES = [
  'Data-driven',
  'Intuition-led',
  'Speed over perfection',
  'Consensus-based',
];

// ====== NEW: Strategic Plan Context for ALL users (opt-in toggle) ======

import { type ScenarioTag } from './scenarioMemory';

export interface StrategicPlanContext {
  strategic_mode: boolean;
  planning_seniority?: 'individual_contributor' | 'manager' | 'director' | 'vp_head' | 'founder_owner';
  planning_scope?: ('personal' | 'team' | 'department' | 'company')[];
  time_horizon?: '30_days' | '90_days' | '6_months' | '12_months';
  constraints?: {
    budget?: string;
    team_size?: number;
    dependencies?: string;
    risk_tolerance?: 'low' | 'medium' | 'high';
  };
  success_definition?: string;
  // Phase 8.9: Scenario Memory
  scenario?: ScenarioTag;
}

export const SENIORITY_LEVELS = [
  { value: 'individual_contributor', label: 'Individual Contributor' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'vp_head', label: 'VP / Head' },
  { value: 'founder_owner', label: 'Founder / Owner' },
] as const;

export const PLANNING_SCOPES = [
  { value: 'personal', label: 'Personal execution' },
  { value: 'team', label: 'Team initiative' },
  { value: 'department', label: 'Department-level strategy' },
  { value: 'company', label: 'Company-wide initiative' },
] as const;

export const TIME_HORIZONS = [
  { value: '30_days', label: '30 days' },
  { value: '90_days', label: '90 days' },
  { value: '6_months', label: '6 months' },
  { value: '12_months', label: '12 months' },
] as const;

export const RISK_TOLERANCES = ['low', 'medium', 'high'] as const;
