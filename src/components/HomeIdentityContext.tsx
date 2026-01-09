import { cn } from '@/lib/utils';

interface HomeIdentityContextProps {
  identityStatement?: string;
  className?: string;
}

export const HomeIdentityContext = ({
  identityStatement,
  className
}: HomeIdentityContextProps) => {
  if (!identityStatement) return null;

  return (
    <div className={cn("animate-fade-in", className)}>
      <p className="text-sm text-muted-foreground/60 leading-relaxed">
        This week supports your goal of{' '}
        <span className="text-muted-foreground/80">
          {identityStatement.toLowerCase().replace(/^this plan exists to help me\s*/i, '').replace(/\.$/, '')}
        </span>
        .
      </p>
    </div>
  );
};
