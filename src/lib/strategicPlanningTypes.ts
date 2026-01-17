// Strategic Planning Mode Types - Phase 8.1

export type PlanningMode = 'standard' | 'strategic';

export type SeniorityLevel = 
  | 'individual_contributor'
  | 'manager'
  | 'director'
  | 'vp_head'
  | 'founder_owner';

export type PlanningScope = 
  | 'personal_execution'
  | 'team_initiative'
  | 'department_strategy'
  | 'company_wide';

export type TimeHorizon = '30_days' | '90_days' | '6_months' | '12_months';

export type RiskTolerance = 'low' | 'medium' | 'high';

export interface PlanningConstraints {
  budget?: string;
  team_size?: number;
  dependencies?: string;
  risk_tolerance?: RiskTolerance;
}

export interface PlanContext {
  strategic_mode: boolean;
  planning_seniority?: SeniorityLevel;
  planning_scope?: PlanningScope[];
  time_horizon?: TimeHorizon;
  constraints?: PlanningConstraints;
  success_definition?: string;
}

// Display labels for UI
export const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
  { value: 'individual_contributor', label: 'Individual Contributor' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'vp_head', label: 'VP / Head' },
  { value: 'founder_owner', label: 'Founder / Owner' },
];

export const PLANNING_SCOPES: { value: PlanningScope; label: string }[] = [
  { value: 'personal_execution', label: 'Personal execution' },
  { value: 'team_initiative', label: 'Team initiative' },
  { value: 'department_strategy', label: 'Department-level strategy' },
  { value: 'company_wide', label: 'Company-wide initiative' },
];

export const TIME_HORIZONS: { value: TimeHorizon; label: string }[] = [
  { value: '30_days', label: '30 days' },
  { value: '90_days', label: '90 days' },
  { value: '6_months', label: '6 months' },
  { value: '12_months', label: '12 months' },
];

export const RISK_TOLERANCES: { value: RiskTolerance; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// Utility to create empty plan context
export function createEmptyPlanContext(): PlanContext | null {
  return null;
}

export function createStrategicPlanContext(): PlanContext {
  return {
    strategic_mode: true,
    planning_scope: [],
    constraints: {},
  };
}
