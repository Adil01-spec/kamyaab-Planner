import { cn } from '@/lib/utils';

interface HomeDesktopCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Glassmorphic card wrapper for desktop Home layout.
 * Provides consistent styling across sidebar sections.
 */
export function HomeDesktopCard({ title, children, className }: HomeDesktopCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl p-5 lg:p-6",
        "bg-card/60 backdrop-blur-xl",
        "border border-border/20",
        "shadow-lg shadow-primary/5",
        "transition-all duration-200",
        "lg:hover:-translate-y-0.5 lg:hover:shadow-xl lg:hover:shadow-primary/10",
        className
      )}
    >
      {title && (
        <h3 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
