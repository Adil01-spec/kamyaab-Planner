/**
 * Shared Strategy Overview Card
 * Renders strategic plan details (objective, why now, success definition, assumptions, risks)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Lightbulb, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type CollaborationMode } from '@/lib/collaborationMode';

interface StrategyInsightsCardProps {
  plan: any;
  mode: CollaborationMode;
  defaultOpen?: boolean;
}

export function StrategyInsightsCard({ plan, mode, defaultOpen = false }: StrategyInsightsCardProps) {
  const isStrategic = plan?.is_strategic_plan || false;
  const isPrint = mode === 'public_snapshot';

  if (!isStrategic || !plan?.strategy_overview) return null;

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className={isPrint ? 'print:shadow-none print:border-foreground/20' : ''}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className={`w-5 h-5 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
                <CardTitle className="text-lg">Strategy Overview</CardTitle>
              </div>
              <Badge variant="outline" className="bg-primary/5">Strategic</Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Objective */}
            <div className={`p-4 rounded-lg bg-primary/5 border border-primary/20 ${isPrint ? 'print:bg-muted/30 print:border-foreground/20' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className={`w-4 h-4 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
                <h4 className="font-medium">Objective</h4>
              </div>
              <p className="text-muted-foreground">{plan.strategy_overview.objective}</p>
            </div>

            {/* Why Now */}
            {plan.strategy_overview.why_now && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Why Now</h4>
                <p className="text-muted-foreground">{plan.strategy_overview.why_now}</p>
              </div>
            )}

            {/* Success Definition */}
            {plan.strategy_overview.success_definition && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Success Definition</h4>
                <p className="text-muted-foreground">{plan.strategy_overview.success_definition}</p>
              </div>
            )}

            {/* Assumptions */}
            {plan.assumptions?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Key Assumptions</h4>
                <ul className="space-y-1">
                  {plan.assumptions.map((assumption: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className={`text-primary ${isPrint ? 'print:text-foreground' : ''}`}>•</span>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {plan.risks?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 text-destructive ${isPrint ? 'print:text-foreground' : ''}`} />
                  Risks & Mitigations
                </h4>
                <div className="space-y-2">
                  {plan.risks.map((riskItem: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg bg-destructive/5 border border-destructive/20 ${isPrint ? 'print:bg-muted/30 print:border-foreground/20' : ''}`}>
                      <p className="font-medium">{riskItem.risk}</p>
                      {riskItem.mitigation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Mitigation:</span> {riskItem.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
