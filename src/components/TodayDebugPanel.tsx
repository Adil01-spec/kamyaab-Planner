import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TodayDebugPanelProps {
  className?: string;
  data: any;
}

export function TodayDebugPanel({ className, data }: TodayDebugPanelProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <Card
      className={cn(
        "mt-6 border-border/50 bg-card/70 p-4 font-mono text-xs text-foreground/80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-semibold text-foreground">Debug /today</div>
        <div className="text-muted-foreground">DEV only</div>
      </div>
      <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}
