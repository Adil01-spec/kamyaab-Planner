// Executive profile detection utilities

const EXECUTIVE_PROFESSIONS = ['business_owner'];

const EXECUTIVE_KEYWORDS = [
  'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cio',
  'vp', 'vice president',
  'director', 'head of', 'founder', 'co-founder',
  'president', 'chief', 'executive', 'managing director',
  'partner', 'principal', 'owner'
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

// Strategic planning field definitions
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
