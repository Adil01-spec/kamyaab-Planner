import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { useAdminAction, type AdminSubscription } from '@/hooks/useAdminDashboard';

interface Props {
  subscriptions: AdminSubscription[];
  emailMap: Record<string, string>;
  expiringSoonOnly?: boolean;
}

export default function SubscriptionsTable({ subscriptions, emailMap, expiringSoonOnly }: Props) {
  const { mutateAsync, isPending } = useAdminAction();
  const [activeId, setActiveId] = useState<string | null>(null);

  let filtered = subscriptions;
  if (expiringSoonOnly) {
    const now = new Date();
    filtered = subscriptions.filter(s => {
      if (s.status !== 'active') return false;
      const days = differenceInDays(new Date(s.end_date), now);
      return days <= 3 && days >= 0;
    });
  }

  const handleAction = async (action: string, subscription_id: string) => {
    setActiveId(subscription_id);
    try {
      await mutateAsync({ action, subscription_id });
      toast({ title: action === 'deactivate_subscription' ? 'Subscription deactivated' : 'Subscription extended +30 days' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActiveId(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-emerald-500/20 text-emerald-600 border-0">Active</Badge>;
    if (status === 'expired') return <Badge variant="secondary">Expired</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{expiringSoonOnly ? 'No subscriptions expiring soon.' : 'No subscriptions found.'}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(s => (
            <TableRow key={s.id}>
              <TableCell className="text-xs">{emailMap[s.user_id] || s.user_id.slice(0, 8)}</TableCell>
              <TableCell className="capitalize">{s.plan_tier}</TableCell>
              <TableCell>{statusBadge(s.status)}</TableCell>
              <TableCell className="text-xs">{format(new Date(s.start_date), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-xs">{format(new Date(s.end_date), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-xs">{s.payment_source || '—'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {s.status === 'active' && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={isPending && activeId === s.id} onClick={() => handleAction('deactivate_subscription', s.id)}>
                      {isPending && activeId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MinusCircle className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" disabled={isPending && activeId === s.id} onClick={() => handleAction('extend_subscription', s.id)}>
                    {isPending && activeId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
