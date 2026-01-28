/**
 * Strategic Review Export Button
 * 
 * Export button with Pro gating for generating professional plan summaries.
 */

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProFeatureIndicator } from '@/components/ProFeatureIndicator';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { generateStrategicReviewPdf } from '@/lib/strategicReviewPdfExport';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type ScenarioTag } from '@/lib/scenarioMemory';

interface PlanData {
  overview: string;
  total_weeks: number;
  weeks: any[];
  milestones: any[];
  motivation: string[];
  is_strategic_plan?: boolean;
  strategy_overview?: any;
  assumptions?: string[];
  risks?: any[];
  reality_check?: any;
  execution_insights?: any;
  plan_context?: {
    scenario?: ScenarioTag;
  };
}

interface StrategicReviewExportButtonProps {
  planData: PlanData;
  planCreatedAt: string;
  projectTitle: string;
  projectDescription?: string;
  userName?: string;
  className?: string;
}

export function StrategicReviewExportButton({
  planData,
  planCreatedAt,
  projectTitle,
  projectDescription,
  userName,
  className,
}: StrategicReviewExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { hasAccess, trackInterest } = useFeatureAccess('strategic-review-export', planData);

  const handleExport = async () => {
    // Pro gating - soft upsell for Free users
    if (!hasAccess) {
      trackInterest('attempted');
      toast({
        title: 'Pro Feature',
        description: 'Strategic Review Export is available with Strategic Planning. Create professional summaries of your plans and execution insights.',
      });
      return;
    }

    setIsGenerating(true);

    try {
      await generateStrategicReviewPdf({
        projectTitle,
        projectDescription,
        planningMode: planData.is_strategic_plan ? 'Strategic' : 'Standard',
        createdAt: planCreatedAt,
        scenarioContext: planData.plan_context?.scenario,
        userName,
        planData,
      });

      toast({
        title: 'Report Downloaded',
        description: 'Your Strategic Review PDF has been generated successfully.',
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error generating your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isGenerating}
            className={cn(
              'gap-2 text-muted-foreground hover:text-foreground',
              className
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export Review</span>
                <ProFeatureIndicator 
                  featureId="strategic-review-export" 
                  planData={planData}
                  variant="star"
                  showTooltip={false}
                  showOnlyWhenLocked
                  className="ml-1"
                />
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          {hasAccess 
            ? 'Creates a professional summary of your plan and execution insights'
            : 'Available with Strategic Planning'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
