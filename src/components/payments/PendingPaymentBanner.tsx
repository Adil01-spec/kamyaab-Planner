import { useLatestPendingPayment } from '@/hooks/useManualPayments';
import { Clock, AlertCircle } from 'lucide-react';
import { useManualPayments } from '@/hooks/useManualPayments';

export function PendingPaymentBanner() {
  const { data: payments } = useManualPayments();
  const pending = payments?.find((p) => p.status === 'pending');
  const rejected = payments?.find((p) => p.status === 'rejected' && !payments.some(q => q.status === 'approved' && new Date(q.created_at) > new Date(p.created_at)));

  if (rejected) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Payment Rejected</p>
          <p className="text-xs text-destructive/80 mt-0.5">
            {rejected.admin_notes || 'Your payment could not be verified. Please resubmit.'}
          </p>
        </div>
      </div>
    );
  }

  if (!pending) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
      <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">Payment Under Review</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your upgrade will activate once verified. Expected within 24 hours.
        </p>
      </div>
    </div>
  );
}
