import { jsPDF } from 'jspdf';
import { 
  ProgressHistory, 
  PlanCycleSnapshot 
} from './personalExecutionProfile';
import {
  detectProgressTrends,
  compareToPreviousPlan,
  attributeImprovements,
  compareStrategicVsStandard,
  ProgressTrend,
  PlanComparison,
  ProgressAttribution,
  StrategicComparison,
} from './progressProof';

interface ExportConfig {
  userName?: string;
  projectTitle?: string;
}

/**
 * Generate a PDF report from progress history
 */
export async function generateProgressPdf(
  history: ProgressHistory,
  config: ExportConfig = {}
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;
  
  const primaryColor: [number, number, number] = [14, 159, 110]; // #0E9F6E
  const textColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const mutedColor: [number, number, number] = [71, 85, 105]; // #475569
  
  // Helper functions
  const addText = (text: string, options: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
  } = {}) => {
    const { fontSize = 10, color = textColor, fontStyle = 'normal', maxWidth = contentWidth } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', fontStyle);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.4 + 2;
  };
  
  const addSectionHeader = (title: string) => {
    yPosition += 6;
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition - 4, 3, 12, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 8, yPosition + 4);
    yPosition += 14;
  };
  
  const addDivider = () => {
    yPosition += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };
  
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPosition > doc.internal.pageSize.getHeight() - requiredSpace) {
      doc.addPage();
      yPosition = margin;
    }
  };
  
  // ====== HEADER ======
  doc.setFillColor(248, 250, 249);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Progress Report', margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 40);
  
  if (config.userName) {
    doc.text(`User: ${config.userName}`, pageWidth - margin - 60, 40);
  }
  
  yPosition = 60;
  
  // ====== SUMMARY SECTION ======
  addSectionHeader('Summary');
  
  addText(`Total Plans Tracked: ${history.total_plans_tracked}`, { fontStyle: 'bold' });
  
  const strategicCount = history.snapshots.filter(s => s.plan_type === 'strategic').length;
  const standardCount = history.snapshots.filter(s => s.plan_type === 'standard').length;
  addText(`Plan Types: ${strategicCount} strategic, ${standardCount} standard`, { color: mutedColor });
  
  if (history.last_snapshot_date) {
    const lastDate = new Date(history.last_snapshot_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    addText(`Last Activity: ${lastDate}`, { color: mutedColor });
  }
  
  addDivider();
  
  // ====== PROGRESS TRENDS ======
  const trends = detectProgressTrends(history, 3);
  
  if (trends.length > 0) {
    checkPageBreak();
    addSectionHeader('Progress Trends');
    
    trends.forEach(trend => {
      const arrow = trend.trend.direction === 'improving' ? '↑' : 
                    trend.trend.direction === 'declining' ? '↓' : '→';
      const statusLabel = trend.trend.direction === 'improving' ? 'Improving' :
                          trend.trend.direction === 'declining' ? 'Declining' : 'Stable';
      
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${arrow} ${trend.label}`, margin, yPosition);
      
      // Status badge
      const badgeColor: [number, number, number] = trend.trend.direction === 'improving' 
        ? primaryColor 
        : mutedColor;
      doc.setFontSize(8);
      doc.setTextColor(...badgeColor);
      doc.text(`[${statusLabel}]`, margin + 80, yPosition);
      
      yPosition += 6;
      addText(trend.detail, { color: mutedColor, fontSize: 9 });
      yPosition += 4;
    });
    
    addDivider();
  }
  
  // ====== COMPARISON TO PREVIOUS PLAN ======
  const comparison = compareToPreviousPlan(history);
  
  if (comparison.available && comparison.insights.length > 0) {
    checkPageBreak();
    addSectionHeader('Compared to Previous Plan');
    
    comparison.insights.forEach(insight => {
      addText(`• ${insight.detail}`, { fontSize: 10 });
    });
    
    if (comparison.summary) {
      yPosition += 2;
      addText(comparison.summary, { color: mutedColor, fontSize: 9 });
    }
    
    addDivider();
  }
  
  // ====== IMPROVEMENT ATTRIBUTIONS ======
  if (history.snapshots.length >= 2) {
    const current = history.snapshots[history.snapshots.length - 1];
    const previous = history.snapshots[history.snapshots.length - 2];
    const attributions = attributeImprovements(current, previous);
    
    if (attributions.length > 0) {
      checkPageBreak();
      addSectionHeader('Why This Improved');
      
      attributions.forEach(attr => {
        addText(attr.attributed_to, { fontStyle: 'bold', fontSize: 10 });
        addText('Based on your execution data', { color: mutedColor, fontSize: 8 });
        yPosition += 2;
      });
      
      addDivider();
    }
  }
  
  // ====== STRATEGIC VS STANDARD ======
  const strategicComparison = compareStrategicVsStandard(history);
  
  if (strategicComparison.available) {
    checkPageBreak();
    addSectionHeader('Strategic vs Standard Plans');
    
    if (strategicComparison.strategic_insight) {
      addText(strategicComparison.strategic_insight, { fontSize: 10 });
    }
    if (strategicComparison.standard_insight) {
      addText(strategicComparison.standard_insight, { fontSize: 10 });
    }
    
    addDivider();
  }
  
  // ====== HISTORICAL SNAPSHOTS ======
  checkPageBreak(60);
  addSectionHeader('Plan History');
  
  // Table headers
  doc.setFillColor(248, 250, 249);
  doc.rect(margin, yPosition - 4, contentWidth, 14, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  
  const colWidths = [45, 30, 30, 35, 30];
  const colPositions = [margin];
  for (let i = 0; i < colWidths.length - 1; i++) {
    colPositions.push(colPositions[i] + colWidths[i]);
  }
  
  doc.text('Date', colPositions[0] + 2, yPosition + 4);
  doc.text('Type', colPositions[1] + 2, yPosition + 4);
  doc.text('Completed', colPositions[2] + 2, yPosition + 4);
  doc.text('Smoothness', colPositions[3] + 2, yPosition + 4);
  doc.text('Variance', colPositions[4] + 2, yPosition + 4);
  
  yPosition += 14;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  
  const sortedSnapshots = [...history.snapshots].reverse().slice(0, 10);
  
  sortedSnapshots.forEach((snapshot, index) => {
    checkPageBreak(20);
    
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, yPosition - 4, contentWidth, 12, 'F');
    }
    
    const date = new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
    
    doc.text(date, colPositions[0] + 2, yPosition + 3);
    doc.text(snapshot.plan_type, colPositions[1] + 2, yPosition + 3);
    doc.text(`${snapshot.metrics.tasks_completed} tasks`, colPositions[2] + 2, yPosition + 3);
    doc.text(`${snapshot.metrics.completion_smoothness}%`, colPositions[3] + 2, yPosition + 3);
    
    const variance = snapshot.metrics.average_overrun_percent;
    const varianceText = variance >= 0 ? `+${variance.toFixed(0)}%` : `${variance.toFixed(0)}%`;
    doc.text(varianceText, colPositions[4] + 2, yPosition + 3);
    
    yPosition += 12;
  });
  
  // ====== FOOTER ======
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Kaamyab',
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save the PDF
  const fileName = `progress-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
