/**
 * Shared Reality Check Card (read-only presentation)
 * Shows feasibility assessment, risk signals, focus gaps
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type CollaborationMode } from '@/lib/collaborationMode';

interface RealityCheckCardProps {
  plan: any;
  mode: CollaborationMode;
}

export function RealityCheckCard({ plan, mode }: RealityCheckCardProps) {
  const isPrint = mode === 'public_snapshot';

  if (!plan?.reality_check) return null;

  const { reality_check } = plan;

  return (
    <Card className={isPrint ? 'print:shadow-none print:border-foreground/20' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
            <CardTitle className="text-lg">Reality Check</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              isPrint && 'print:text-foreground print:border-foreground/30',
              reality_check.feasibility?.assessment === 'realistic'
                ? 'border-primary/50 text-primary'
                : reality_check.feasibility?.assessment === 'challenging'
                ? 'border-yellow-500/50 text-yellow-600'
                : 'border-destructive/50 text-destructive'
            )}
          >
            {reality_check.feasibility?.assessment}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reality_check.feasibility?.summary && (
          <p className="text-muted-foreground">{reality_check.feasibility.summary}</p>
        )}

        {/* Risk Signals */}
        {reality_check.risk_signals?.items?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Risk Signals</h4>
            <div className="space-y-2">
              {reality_check.risk_signals.items.slice(0, 3).map((risk: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs shrink-0 mt-0.5',
                      risk.severity === 'high'
                        ? 'border-destructive/50 text-destructive'
                        : risk.severity === 'medium'
                        ? 'border-yellow-500/50 text-yellow-600'
                        : 'border-muted'
                    )}
                  >
                    {risk.severity}
                  </Badge>
                  <span className="text-muted-foreground">{risk.signal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus Gaps */}
        {reality_check.focus_gaps?.items?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Focus Gaps</h4>
            <ul className="space-y-1">
              {reality_check.focus_gaps.items.map((gap: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className={`text-primary ${isPrint ? 'print:text-foreground' : ''}`}>•</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Blind Spots */}
        {reality_check.focus_gaps?.strategic_blind_spots?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Strategic Blind Spots</h4>
            <ul className="space-y-1">
              {reality_check.focus_gaps.strategic_blind_spots.map((spot: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className={`text-destructive ${isPrint ? 'print:text-foreground' : ''}`}>•</span>
                  {spot}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
