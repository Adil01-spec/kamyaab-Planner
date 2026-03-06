import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import { ManualPaymentModal } from '@/components/payments/ManualPaymentModal';
import { type ProductTier } from '@/lib/subscriptionTiers';

export function RenewalBanner() {
  const { tier, daysRemaining, inGrace, isPaid, state } = useSubscription();
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Only show for paid users close to expiry or in grace
  if (!isPaid) return null;
  if (!inGrace && (daysRemaining === null || daysRemaining > 2)) return null;

  const isGrace = inGrace || state === 'grace';
  const message = isGrace
    ? 'Your subscription has expired. You have limited access during the grace period.'
    : `Your subscription expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;

  return (
    <>
      <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
        isGrace 
          ? 'bg-destructive/10 border-destructive/30' 
          : 'bg-accent/50 border-accent'
      }`}>
        {isGrace ? (
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-primary shrink-0" />
        )}
        <p className={`text-sm flex-1 ${isGrace ? 'text-destructive' : 'text-foreground'}`}>
          {message}
        </p>
        <Button
          size="sm"
          variant={isGrace ? 'destructive' : 'default'}
          onClick={() => setPaymentOpen(true)}
          className="shrink-0 text-xs"
        >
          Renew Now
        </Button>
      </div>
      <ManualPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        selectedTier={tier as ProductTier}
      />
    </>
  );
}
