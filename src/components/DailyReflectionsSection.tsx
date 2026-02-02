/**
 * DailyReflectionsSection (Phase 9.7)
 * 
 * Displays day closure history on /review page.
 * Shows last 7 days with reflections. Collapsible, non-intrusive.
 */

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Moon, ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DayClosure, formatSummaryText } from '@/lib/dayClosure';

interface DailyReflectionsSectionProps {
  closures: DayClosure[];
  className?: string;
}

export function DailyReflectionsSection({ closures, className }: DailyReflectionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if no closures
  if (!closures || closures.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn("glass-card animate-slide-up overflow-hidden", className)}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Daily Reflections</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {closures.length} day{closures.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {closures.map((closure) => (
                <DayClosureItem key={closure.date} closure={closure} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DayClosureItem({ closure }: { closure: DayClosure }) {
  const date = parseISO(closure.date);
  const formattedDate = format(date, 'EEE, MMM d');
  const summaryText = formatSummaryText(closure.summary);

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{formattedDate}</span>
        <Badge variant="outline" className="text-xs font-normal">
          {summaryText}
        </Badge>
      </div>
      
      {closure.reflection && (
        <div className="flex items-start gap-2 mt-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground italic">
            "{closure.reflection}"
          </p>
        </div>
      )}
    </div>
  );
}
