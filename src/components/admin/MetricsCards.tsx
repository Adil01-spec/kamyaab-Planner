import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, AlertTriangle, Clock, DollarSign, UserCheck } from 'lucide-react';
import type { AdminProfile, AdminSubscription } from '@/hooks/useAdminDashboard';
import type { ManualPayment } from '@/hooks/useManualPayments';

const TIER_PRICES: Record<string, number> = {
  student: 299,
  pro: 999,
  business: 2499,
};

interface Props {
  profiles: AdminProfile[];
  subscriptions: AdminSubscription[];
  payments: ManualPayment[];
}

export default function MetricsCards({ profiles, subscriptions, payments }: Props) {
  const totalUsers = profiles.length;
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const paidUsers = activeSubs.length;
  const freeUsers = totalUsers - paidUsers;
  const expiredSubs = subscriptions.filter(s => s.status === 'expired' || s.status === 'fully_expired').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const mrr = activeSubs.reduce((sum, s) => sum + (TIER_PRICES[s.plan_tier] || 0), 0);

  const cards = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Free Users', value: freeUsers, icon: Users, color: 'text-muted-foreground' },
    { label: 'Active Paid', value: paidUsers, icon: UserCheck, color: 'text-emerald-500' },
    { label: 'Expired', value: expiredSubs, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Pending Payments', value: pendingPayments, icon: Clock, color: 'text-orange-500' },
    { label: 'MRR (PKR)', value: mrr.toLocaleString(), icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <Card key={c.label} className="border-border/30 bg-card/80">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
