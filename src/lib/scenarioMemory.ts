// ============================================
// Phase 8.9: Scenario Memory
// ============================================

import { PlanCycleSnapshot } from './personalExecutionProfile';

// ============================================
// Scenario Tag Types
// ============================================

export type ScenarioTag = 
  | 'routine'            // Routine execution
  | 'high_pressure'      // High pressure / urgency
  | 'uncertain_inputs'   // Uncertain inputs
  | 'heavy_coordination' // Heavy coordination
  | 'learning'           // Learning / exploratory
  | null;                // No tag (skipped)

export interface ScenarioOption {
  value: Exclude<ScenarioTag, null>;
  label: string;
  description: string;
  icon: 'CheckCircle' | 'Zap' | 'HelpCircle' | 'Users' | 'BookOpen';
}

export const SCENARIO_OPTIONS: ScenarioOption[] = [
  { 
    value: 'routine', 
    label: 'Routine execution', 
    description: 'Standard workflow, predictable scope',
    icon: 'CheckCircle' 
  },
  { 
    value: 'high_pressure', 
    label: 'High pressure / urgency', 
    description: 'Tight deadlines, high stakes',
    icon: 'Zap' 
  },
  { 
    value: 'uncertain_inputs', 
    label: 'Uncertain inputs', 
    description: 'Unclear requirements, exploration needed',
    icon: 'HelpCircle' 
  },
  { 
    value: 'heavy_coordination', 
    label: 'Heavy coordination', 
    description: 'Dependencies on others, sync overhead',
    icon: 'Users' 
  },
  { 
    value: 'learning', 
    label: 'Learning / exploratory', 
    description: 'New domain, skill building',
    icon: 'BookOpen' 
  },
];

// ============================================
// Context-Aware Phrasing
// ============================================

/**
 * Get context-aware phrasing prefix for insights.
 * Returns null if no scenario or scenario doesn't warrant adjustment.
 */
export function getScenarioContextPrefix(scenario: ScenarioTag | undefined): string | null {
  if (!scenario) return null;
  
  const prefixes: Record<Exclude<ScenarioTag, null>, string | null> = {
    routine: null, // Routine doesn't need special context
    high_pressure: 'Given the urgency involved',
    uncertain_inputs: 'With the uncertainty you faced',
    heavy_coordination: 'Given the coordination overhead',
    learning: 'As an exploratory effort',
  };
  
  return prefixes[scenario] || null;
}

/**
 * Get a scenario-aware explanation for delays/overruns.
 * These explain (without excusing) common patterns.
 */
export function getScenarioDelayContext(scenario: ScenarioTag | undefined): string | null {
  if (!scenario) return null;
  
  const contexts: Record<Exclude<ScenarioTag, null>, string | null> = {
    routine: null,
    high_pressure: 'Delays are more common in high-pressure scenarios.',
    uncertain_inputs: 'Variance is expected when inputs are uncertain.',
    heavy_coordination: 'Coordination overhead often adds to timelines.',
    learning: 'Learning phases typically show higher variance.',
  };
  
  return contexts[scenario] || null;
}

/**
 * Wrap an insight with scenario context if applicable.
 * Type: 'positive' acknowledges achievement, 'neutral' adds context without judgment.
 */
export function wrapWithScenarioContext(
  insight: string,
  scenario: ScenarioTag | undefined,
  type: 'positive' | 'neutral'
): string {
  const prefix = getScenarioContextPrefix(scenario);
  if (!prefix) return insight;
  
  // Positive insights: context acknowledges achievement
  // "Given the urgency involved, execution remained stable."
  if (type === 'positive') {
    // Ensure the insight starts with lowercase for proper sentence flow
    const lowerInsight = insight.charAt(0).toLowerCase() + insight.slice(1);
    return `${prefix}, ${lowerInsight}`;
  }
  
  // Neutral: just return as-is (context may be shown separately)
  return insight;
}

// ============================================
// Scenario Pattern Analysis (Long-term)
// ============================================

export interface ScenarioMetrics {
  count: number;
  avg_smoothness: number;
  avg_overrun: number;
  avg_alignment: number;
}

export interface ScenarioPatternAnalysis {
  patterns: Record<string, ScenarioMetrics>;
  has_enough_data: boolean;
}

/**
 * Analyze performance patterns across different scenarios.
 * Returns meaningful insights only when sufficient data exists.
 */
export function analyzeScenarioPatterns(
  snapshots: PlanCycleSnapshot[]
): ScenarioPatternAnalysis {
  // Group snapshots by scenario
  const byScenario: Record<string, PlanCycleSnapshot[]> = {};
  
  snapshots.forEach(snapshot => {
    const scenario = snapshot.scenario || 'untagged';
    if (!byScenario[scenario]) {
      byScenario[scenario] = [];
    }
    byScenario[scenario].push(snapshot);
  });
  
  // Calculate averages per scenario (minimum 2 plans per scenario)
  const patterns: Record<string, ScenarioMetrics> = {};
  
  for (const [scenario, group] of Object.entries(byScenario)) {
    if (group.length >= 2) {
      patterns[scenario] = {
        count: group.length,
        avg_smoothness: average(group.map(s => s.metrics.completion_smoothness)),
        avg_overrun: average(group.map(s => Math.abs(s.metrics.average_overrun_percent))),
        avg_alignment: average(group.map(s => s.metrics.planning_alignment)),
      };
    }
  }
  
  // Need at least 2 scenarios with 2+ plans each for meaningful comparison
  const scenariosWithEnoughData = Object.keys(patterns).filter(k => k !== 'untagged');
  const hasEnoughData = scenariosWithEnoughData.length >= 2;
  
  return { patterns, has_enough_data: hasEnoughData };
}

/**
 * Generate observational insights about scenario performance.
 * These are descriptive, not prescriptive.
 */
export function generateScenarioInsights(
  analysis: ScenarioPatternAnalysis
): string[] {
  if (!analysis.has_enough_data) return [];
  
  const insights: string[] = [];
  const { patterns } = analysis;
  
  // Find best and most variable scenarios
  const scenarios = Object.entries(patterns)
    .filter(([key]) => key !== 'untagged')
    .sort((a, b) => b[1].avg_smoothness - a[1].avg_smoothness);
  
  if (scenarios.length < 2) return [];
  
  const [bestScenario, bestMetrics] = scenarios[0];
  const [worstScenario, worstMetrics] = scenarios[scenarios.length - 1];
  
  // Generate comparative insight if difference is significant
  if (bestMetrics.avg_smoothness - worstMetrics.avg_smoothness > 10) {
    const bestLabel = getScenarioLabel(bestScenario as ScenarioTag);
    insights.push(`You execute more consistently in ${bestLabel.toLowerCase()} scenarios.`);
  }
  
  // Check for learning scenario insights
  const learningData = patterns['learning'];
  if (learningData && learningData.avg_overrun > 20) {
    insights.push('Exploratory plans show higher variance but support skill building.');
  }
  
  // Check for coordination overhead
  const coordinationData = patterns['heavy_coordination'];
  if (coordinationData && coordinationData.avg_overrun > 25) {
    insights.push('Coordination-heavy work typically adds to your timelines.');
  }
  
  return insights.slice(0, 2); // Max 2 insights
}

/**
 * Get human-readable label for a scenario tag.
 */
export function getScenarioLabel(scenario: ScenarioTag | undefined): string {
  if (!scenario) return 'Untagged';
  
  const option = SCENARIO_OPTIONS.find(o => o.value === scenario);
  return option?.label || 'Unknown';
}

// ============================================
// Utility Functions
// ============================================

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
