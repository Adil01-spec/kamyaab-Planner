/**
 * Strategic Review PDF Export
 * 
 * Generates a professional, shareable PDF of the user's plan and execution insights.
 * Read-only export - never modifies plan data.
 */

import { jsPDF } from 'jspdf';
import { type ExecutionInsightsData } from '@/components/ExecutionInsights';
import { type ScenarioTag } from '@/lib/scenarioMemory';

// Types for plan data
interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  execution_state?: 'idle' | 'doing' | 'paused' | 'done';
  time_spent_minutes?: number;
  effort_rating?: 'easy' | 'okay' | 'hard';
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface Milestone {
  title: string;
  week: number;
  outcome?: string;
  timeframe?: string;
}

interface Risk {
  risk: string;
  mitigation?: string;
}

interface StrategyOverview {
  objective: string;
  why_now?: string;
  success_definition?: string;
}

interface RealityCritique {
  feasibility: {
    assessment: 'realistic' | 'challenging' | 'unrealistic';
    summary: string;
    concerns: string[];
  };
  risk_signals: { items: { signal: string; severity: 'low' | 'medium' | 'high' }[] };
  focus_gaps: { items: string[]; strategic_blind_spots?: string[] };
  deprioritization_suggestions: { items: { task_or_area: string; reason: string }[] };
  is_strategic: boolean;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  milestones: Milestone[];
  weeks: Week[];
  motivation: string[];
  is_strategic_plan?: boolean;
  strategy_overview?: StrategyOverview;
  assumptions?: string[];
  risks?: Risk[];
  reality_check?: RealityCritique;
  execution_insights?: ExecutionInsightsData;
  plan_context?: {
    scenario?: ScenarioTag;
  };
}

interface StrategicReviewExportConfig {
  projectTitle: string;
  projectDescription?: string;
  planningMode: 'Strategic' | 'Standard';
  createdAt: string;
  scenarioContext?: ScenarioTag;
  userName?: string;
  planData: PlanData;
}

interface ClosingSummary {
  what_worked: string[];
  what_slowed: string[];
  what_to_adjust: string[];
}

// Brand colors
const PRIMARY_COLOR: [number, number, number] = [14, 159, 110]; // #0E9F6E
const TEXT_COLOR: [number, number, number] = [15, 23, 42]; // #0F172A
const MUTED_COLOR: [number, number, number] = [71, 85, 105]; // #475569
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94]; // #22C55E
const WARNING_COLOR: [number, number, number] = [245, 158, 11]; // #F59E0B
const DANGER_COLOR: [number, number, number] = [239, 68, 68]; // #EF4444

/**
 * Generate closing summary from execution data
 */
function generateClosingSummary(
  executionInsights: ExecutionInsightsData | undefined,
  realityCheck: RealityCritique | undefined
): ClosingSummary {
  return {
    what_worked: deriveWhatWorked(executionInsights),
    what_slowed: deriveWhatSlowed(executionInsights, realityCheck),
    what_to_adjust: deriveWhatToAdjust(executionInsights),
  };
}

function deriveWhatWorked(insights: ExecutionInsightsData | undefined): string[] {
  if (!insights) return [];
  const items: string[] = [];
  
  // From strengths
  if (insights.productivity_patterns?.strengths) {
    items.push(...insights.productivity_patterns.strengths.slice(0, 2));
  }
  
  // From effort pattern if positive
  if (insights.effort_distribution_insight?.pattern === 'smooth-sailing') {
    items.push('Maintained balanced effort distribution');
  }
  
  // From time estimation if accurate
  if (insights.time_estimation_insight?.pattern === 'accurate') {
    items.push('Estimation accuracy was consistent');
  }
  
  return items.slice(0, 3);
}

function deriveWhatSlowed(
  insights: ExecutionInsightsData | undefined,
  realityCheck: RealityCritique | undefined
): string[] {
  const items: string[] = [];
  
  // From bottlenecks
  if (insights?.productivity_patterns?.bottlenecks) {
    items.push(...insights.productivity_patterns.bottlenecks.slice(0, 2));
  }
  
  // From execution diagnosis
  if (insights?.execution_diagnosis?.primary_mistake) {
    items.push(insights.execution_diagnosis.primary_mistake.label);
  }
  
  // From high-severity risks
  const highRisks = realityCheck?.risk_signals?.items
    ?.filter(r => r.severity === 'high')
    .slice(0, 1);
  if (highRisks?.length) {
    items.push(highRisks[0].signal);
  }
  
  return items.slice(0, 3);
}

function deriveWhatToAdjust(insights: ExecutionInsightsData | undefined): string[] {
  const items: string[] = [];
  
  // From forward suggestion
  if (insights?.forward_suggestion) {
    items.push(insights.forward_suggestion.title);
  }
  
  // From adjustment
  if (insights?.execution_diagnosis?.adjustment) {
    items.push(insights.execution_diagnosis.adjustment.action);
  }
  
  return items.slice(0, 2);
}

/**
 * Format minutes to human readable time
 */
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generate Strategic Review PDF
 */
export async function generateStrategicReviewPdf(
  config: StrategicReviewExportConfig
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper functions
  const addText = (text: string, options: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}) => {
    const { 
      fontSize = 10, 
      color = TEXT_COLOR, 
      fontStyle = 'normal', 
      maxWidth = contentWidth,
      align = 'left'
    } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', fontStyle);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const xPos = align === 'center' ? pageWidth / 2 : 
                 align === 'right' ? pageWidth - margin : margin;
    doc.text(lines, xPos, yPosition, { align });
    yPosition += lines.length * fontSize * 0.4 + 2;
  };

  const addSectionHeader = (title: string) => {
    yPosition += 8;
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(margin, yPosition - 4, 3, 14, 'F');
    doc.setFontSize(13);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 8, yPosition + 5);
    yPosition += 18;
  };

  const addSubHeader = (title: string) => {
    yPosition += 4;
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 8;
  };

  const addDivider = () => {
    yPosition += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  const checkPageBreak = (requiredSpace: number = 50) => {
    if (yPosition > pageHeight - requiredSpace) {
      doc.addPage();
      yPosition = margin;
    }
  };

  const addBulletPoint = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text('•', margin + indent, yPosition);
    const lines = doc.splitTextToSize(text, contentWidth - 8 - indent);
    doc.text(lines, margin + 6 + indent, yPosition);
    yPosition += lines.length * 4 + 3;
  };

  // ====== HEADER ======
  doc.setFillColor(248, 250, 249);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Review', margin, 32);

  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 44);

  if (config.userName) {
    doc.text(config.userName, pageWidth - margin, 44, { align: 'right' });
  }

  yPosition = 65;

  // ====== PLAN OVERVIEW ======
  addSectionHeader('Plan Overview');

  addText(config.projectTitle, { fontSize: 14, fontStyle: 'bold' });
  
  if (config.projectDescription) {
    addText(config.projectDescription, { color: MUTED_COLOR });
  }
  yPosition += 4;

  // Metadata row
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont('helvetica', 'normal');

  const metaItems: string[] = [];
  metaItems.push(`Mode: ${config.planningMode}`);
  metaItems.push(`Created: ${new Date(config.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`);
  metaItems.push(`Duration: ${config.planData.total_weeks} weeks`);
  if (config.scenarioContext) {
    metaItems.push(`Context: ${config.scenarioContext}`);
  }

  doc.text(metaItems.join('  •  '), margin, yPosition);
  yPosition += 8;

  // Plan overview text
  if (config.planData.overview) {
    addText(config.planData.overview, { color: MUTED_COLOR, fontSize: 10 });
  }

  addDivider();

  // ====== STRATEGY SECTION (Strategic Plans Only) ======
  if (config.planningMode === 'Strategic' && config.planData.strategy_overview) {
    checkPageBreak();
    addSectionHeader('Strategy');

    // Objective
    addSubHeader('Objective');
    addText(config.planData.strategy_overview.objective, { color: MUTED_COLOR });

    // Why Now
    if (config.planData.strategy_overview.why_now) {
      yPosition += 2;
      addSubHeader('Why Now');
      addText(config.planData.strategy_overview.why_now, { color: MUTED_COLOR });
    }

    // Success Definition
    if (config.planData.strategy_overview.success_definition) {
      yPosition += 2;
      addSubHeader('Success Definition');
      addText(config.planData.strategy_overview.success_definition, { color: MUTED_COLOR });
    }

    // Key Assumptions
    if (config.planData.assumptions && config.planData.assumptions.length > 0) {
      yPosition += 4;
      addSubHeader('Key Assumptions');
      config.planData.assumptions.forEach(assumption => {
        checkPageBreak(20);
        addBulletPoint(assumption);
      });
    }

    // Risks & Blind Spots
    if (config.planData.risks && config.planData.risks.length > 0) {
      yPosition += 4;
      addSubHeader('Risks & Mitigations');
      config.planData.risks.forEach(riskItem => {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.text('•', margin, yPosition);
        doc.text(riskItem.risk, margin + 6, yPosition);
        yPosition += 5;
        if (riskItem.mitigation) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...MUTED_COLOR);
          doc.setFontSize(9);
          const mitigationLines = doc.splitTextToSize(`Mitigation: ${riskItem.mitigation}`, contentWidth - 10);
          doc.text(mitigationLines, margin + 6, yPosition);
          yPosition += mitigationLines.length * 4 + 2;
        }
      });
    }

    // Strategic Milestones
    if (config.planData.milestones && config.planData.milestones.length > 0) {
      yPosition += 4;
      addSubHeader('Strategic Milestones');
      config.planData.milestones.forEach(milestone => {
        checkPageBreak(15);
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${milestone.title}`, margin, yPosition);
        doc.setFontSize(9);
        doc.setTextColor(...MUTED_COLOR);
        doc.text(`Week ${milestone.week}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });
    }

    addDivider();
  }

  // ====== TASK STRUCTURE ======
  checkPageBreak();
  addSectionHeader('Task Structure');

  // Calculate completion stats
  let totalTasks = 0;
  let completedTasks = 0;
  let totalTimeSpent = 0;

  config.planData.weeks.forEach(week => {
    week.tasks.forEach(task => {
      totalTasks++;
      if (task.completed || task.execution_state === 'done') completedTasks++;
      if (task.time_spent_minutes) totalTimeSpent += task.time_spent_minutes;
    });
  });

  // Summary stats
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`${completedTasks}/${totalTasks} tasks completed`, margin, yPosition);
  if (totalTimeSpent > 0) {
    doc.text(`Total time tracked: ${formatTime(totalTimeSpent)}`, pageWidth - margin, yPosition, { align: 'right' });
  }
  yPosition += 10;

  // Tasks by week
  config.planData.weeks.forEach((week, weekIdx) => {
    checkPageBreak(40);

    // Week header
    doc.setFillColor(248, 250, 249);
    doc.rect(margin, yPosition - 4, contentWidth, 18, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(`Week ${week.week}`, margin + 4, yPosition + 6);
    
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(week.focus, margin + 40, yPosition + 6);

    const weekCompleted = week.tasks.filter(t => t.completed || t.execution_state === 'done').length;
    doc.text(`${weekCompleted}/${week.tasks.length}`, pageWidth - margin - 4, yPosition + 6, { align: 'right' });

    yPosition += 20;

    // Task rows
    week.tasks.forEach((task, taskIdx) => {
      checkPageBreak(15);
      
      const isCompleted = task.completed || task.execution_state === 'done';
      
      // Alternating row background
      if (taskIdx % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, yPosition - 3, contentWidth, 12, 'F');
      }

      // Status indicator
      if (isCompleted) {
        doc.setFillColor(...SUCCESS_COLOR);
      } else if (task.execution_state === 'doing') {
        doc.setFillColor(...WARNING_COLOR);
      } else {
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
      }
      doc.circle(margin + 4, yPosition + 2, 2, isCompleted || task.execution_state === 'doing' ? 'F' : 'S');

      // Task title
      doc.setFontSize(9);
      const titleColor = isCompleted ? MUTED_COLOR : TEXT_COLOR;
      doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const maxTitleWidth = contentWidth - 70;
      const titleLines = doc.splitTextToSize(task.title, maxTitleWidth);
      doc.text(titleLines[0] + (titleLines.length > 1 ? '...' : ''), margin + 12, yPosition + 3);

      // Priority badge
      const priorityColor = task.priority === 'High' ? DANGER_COLOR : 
                           task.priority === 'Medium' ? WARNING_COLOR : MUTED_COLOR;
      doc.setFontSize(7);
      doc.setTextColor(...priorityColor);
      doc.text(task.priority, pageWidth - margin - 35, yPosition + 3);

      // Time spent
      if (task.time_spent_minutes) {
        doc.setTextColor(...MUTED_COLOR);
        doc.text(formatTime(task.time_spent_minutes), pageWidth - margin - 4, yPosition + 3, { align: 'right' });
      }

      yPosition += 12;
    });

    yPosition += 6;
  });

  addDivider();

  // ====== EXECUTION INSIGHTS ======
  const insights = config.planData.execution_insights;
  if (insights) {
    checkPageBreak();
    addSectionHeader('Execution Insights');

    // Time Estimation Pattern
    if (insights.time_estimation_insight) {
      addSubHeader('Time Estimation');
      addText(insights.time_estimation_insight.summary, { color: MUTED_COLOR });
      if (insights.time_estimation_insight.recommendation) {
        addText(insights.time_estimation_insight.recommendation, { color: MUTED_COLOR, fontSize: 9 });
      }
      yPosition += 2;
    }

    // Effort Distribution
    if (insights.effort_distribution_insight) {
      addSubHeader('Effort Distribution');
      addText(insights.effort_distribution_insight.summary, { color: MUTED_COLOR });
      if (insights.effort_distribution_insight.observation) {
        addText(insights.effort_distribution_insight.observation, { color: MUTED_COLOR, fontSize: 9 });
      }
      yPosition += 2;
    }

    // Productivity Patterns
    if (insights.productivity_patterns) {
      if (insights.productivity_patterns.peak_performance) {
        addSubHeader('Peak Performance');
        addText(insights.productivity_patterns.peak_performance, { color: MUTED_COLOR });
        yPosition += 2;
      }

      if (insights.productivity_patterns.strengths && insights.productivity_patterns.strengths.length > 0) {
        addSubHeader('Strengths');
        insights.productivity_patterns.strengths.slice(0, 3).forEach(strength => {
          checkPageBreak(15);
          addBulletPoint(strength);
        });
      }

      if (insights.productivity_patterns.bottlenecks && insights.productivity_patterns.bottlenecks.length > 0) {
        addSubHeader('Bottlenecks');
        insights.productivity_patterns.bottlenecks.slice(0, 3).forEach(bottleneck => {
          checkPageBreak(15);
          addBulletPoint(bottleneck);
        });
      }
    }

    // Execution Diagnosis
    if (insights.execution_diagnosis) {
      checkPageBreak(40);
      addSubHeader('Execution Diagnosis');
      
      if (insights.execution_diagnosis.primary_mistake) {
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.text('Primary Pattern:', margin, yPosition);
        yPosition += 5;
        addText(insights.execution_diagnosis.primary_mistake.label, { color: MUTED_COLOR });
        if (insights.execution_diagnosis.primary_mistake.detail) {
          addText(insights.execution_diagnosis.primary_mistake.detail, { color: MUTED_COLOR, fontSize: 9 });
        }
      }

      if (insights.execution_diagnosis.secondary_pattern) {
        yPosition += 2;
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.text('Secondary Pattern:', margin, yPosition);
        yPosition += 5;
        addText(insights.execution_diagnosis.secondary_pattern.label, { color: MUTED_COLOR });
      }

      if (insights.execution_diagnosis.adjustment) {
        yPosition += 2;
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended Adjustment:', margin, yPosition);
        yPosition += 5;
        addText(insights.execution_diagnosis.adjustment.action, { color: MUTED_COLOR });
      }
    }

    // Forward Suggestion
    if (insights.forward_suggestion) {
      checkPageBreak(25);
      addSubHeader('Forward Suggestion');
      addText(insights.forward_suggestion.title, { fontStyle: 'bold', fontSize: 10 });
      if (insights.forward_suggestion.detail) {
        addText(insights.forward_suggestion.detail, { color: MUTED_COLOR, fontSize: 9 });
      }
    }

    addDivider();
  }

  // ====== REALITY CHECK ======
  const realityCheck = config.planData.reality_check;
  if (realityCheck) {
    checkPageBreak();
    addSectionHeader('Reality Check');

    // Feasibility Assessment
    addSubHeader('Feasibility Assessment');
    
    const assessmentColor = realityCheck.feasibility.assessment === 'realistic' ? SUCCESS_COLOR :
                           realityCheck.feasibility.assessment === 'challenging' ? WARNING_COLOR : DANGER_COLOR;
    doc.setFontSize(10);
    doc.setTextColor(...assessmentColor);
    doc.setFont('helvetica', 'bold');
    doc.text(realityCheck.feasibility.assessment.charAt(0).toUpperCase() + 
             realityCheck.feasibility.assessment.slice(1), margin, yPosition);
    yPosition += 6;
    addText(realityCheck.feasibility.summary, { color: MUTED_COLOR });

    // Risk Signals
    if (realityCheck.risk_signals?.items && realityCheck.risk_signals.items.length > 0) {
      yPosition += 4;
      addSubHeader('Risk Signals');
      realityCheck.risk_signals.items.slice(0, 5).forEach(risk => {
        checkPageBreak(15);
        const severityColor = risk.severity === 'high' ? DANGER_COLOR :
                             risk.severity === 'medium' ? WARNING_COLOR : MUTED_COLOR;
        doc.setFontSize(8);
        doc.setTextColor(...severityColor);
        doc.text(`[${risk.severity.toUpperCase()}]`, margin, yPosition);
        doc.setFontSize(10);
        doc.setTextColor(...MUTED_COLOR);
        doc.text(risk.signal, margin + 25, yPosition);
        yPosition += 6;
      });
    }

    // Focus Gaps
    if (realityCheck.focus_gaps?.items && realityCheck.focus_gaps.items.length > 0) {
      yPosition += 4;
      addSubHeader('Focus Gaps');
      realityCheck.focus_gaps.items.slice(0, 4).forEach(gap => {
        checkPageBreak(12);
        addBulletPoint(gap);
      });
    }

    // Strategic Blind Spots
    if (realityCheck.focus_gaps?.strategic_blind_spots && 
        realityCheck.focus_gaps.strategic_blind_spots.length > 0) {
      yPosition += 4;
      addSubHeader('Strategic Blind Spots');
      realityCheck.focus_gaps.strategic_blind_spots.slice(0, 3).forEach(spot => {
        checkPageBreak(12);
        addBulletPoint(spot);
      });
    }

    // De-prioritization Suggestions
    if (realityCheck.deprioritization_suggestions?.items && 
        realityCheck.deprioritization_suggestions.items.length > 0) {
      yPosition += 4;
      addSubHeader('Consider De-prioritizing');
      realityCheck.deprioritization_suggestions.items.slice(0, 3).forEach(item => {
        checkPageBreak(20);
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_COLOR);
        doc.text(`• ${item.task_or_area}`, margin, yPosition);
        yPosition += 5;
        doc.setFontSize(9);
        doc.setTextColor(...MUTED_COLOR);
        const reasonLines = doc.splitTextToSize(item.reason, contentWidth - 10);
        doc.text(reasonLines, margin + 6, yPosition);
        yPosition += reasonLines.length * 4 + 3;
      });
    }

    addDivider();
  }

  // ====== CLOSING SUMMARY ======
  const closingSummary = generateClosingSummary(insights, realityCheck);
  const hasClosingContent = closingSummary.what_worked.length > 0 || 
                           closingSummary.what_slowed.length > 0 || 
                           closingSummary.what_to_adjust.length > 0;

  if (hasClosingContent) {
    checkPageBreak(60);
    addSectionHeader('Closing Summary');

    if (closingSummary.what_worked.length > 0) {
      addSubHeader('What Worked');
      closingSummary.what_worked.forEach(item => {
        checkPageBreak(12);
        addBulletPoint(item);
      });
    }

    if (closingSummary.what_slowed.length > 0) {
      yPosition += 2;
      addSubHeader('What Slowed Execution');
      closingSummary.what_slowed.forEach(item => {
        checkPageBreak(12);
        addBulletPoint(item);
      });
    }

    if (closingSummary.what_to_adjust.length > 0) {
      yPosition += 2;
      addSubHeader('What to Adjust Next Cycle');
      closingSummary.what_to_adjust.forEach(item => {
        checkPageBreak(12);
        addBulletPoint(item);
      });
    }
  }

  // ====== FOOTER ======
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Kaamyab',
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  const fileName = `strategic-review-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
