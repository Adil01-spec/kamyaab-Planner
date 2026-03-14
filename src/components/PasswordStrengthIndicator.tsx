import { validatePassword, type PasswordCheck } from '@/lib/passwordValidation';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthProps) {
  if (!password) return null;

  const { checks } = validatePassword(password);
  const items = [
    { key: 'minLength', label: '8+ characters', ok: checks.minLength },
    { key: 'hasLetter', label: 'A letter', ok: checks.hasLetter },
    { key: 'hasNumber', label: 'A number', ok: checks.hasNumber },
    { key: 'hasSpecial', label: 'A special character', ok: checks.hasSpecial },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-1 text-xs', className)}>
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          {item.ok ? (
            <Check className="w-3 h-3 text-green-500 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-destructive shrink-0" />
          )}
          <span className={cn(item.ok ? 'text-muted-foreground' : 'text-destructive')}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
