/**
 * Pattern Signals Component
 * 
 * Displays subtle, non-judgmental patterns detected across multiple plans.
 * Only shown when patterns appear in 3+ plans.
 */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, TrendingUp, Info } from 'lucide-react';
import { type PatternSignal } from '@/lib/planHistoryComparison';

interface PatternSignalsProps {
  patterns: PatternSignal[];
  totalPlans: number;
}

export function PatternSignals({ patterns, totalPlans }: PatternSignalsProps) {
  if (patterns.length === 0) return null;

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Patterns across {totalPlans} plans
            </span>
            <Badge variant="outline" className="text-[10px]">
              {patterns.length} detected
            </Badge>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="pt-3 space-y-2">
          {patterns.map(pattern => (
            <div 
              key={pattern.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/10"
            >
              <div className="mt-0.5">
                {pattern.severity === 'observation' ? (
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Info className="w-4 h-4 text-primary/60" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-foreground">
                  {pattern.label}
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pattern.detail}
                </p>
              </div>
            </div>
          ))}
          
          <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
            Patterns are observational only, not judgments
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
