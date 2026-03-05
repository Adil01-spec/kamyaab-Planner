import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManualPayment {
  id: string;
  user_id: string;
  email: string;
  plan_tier: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  expires_at: string | null;
  created_at: string;
  approved_at: string | null;
}

export function useManualPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['manual-payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('manual_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ManualPayment[];
    },
    enabled: !!user,
  });
}

export function useLatestPendingPayment() {
  const { data: payments } = useManualPayments();
  return payments?.find((p) => p.status === 'pending') ?? null;
}

export function useAllManualPayments() {
  // Admin-only: uses service role via edge function
  return useQuery({
    queryKey: ['admin-manual-payments'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('approve-manual-payment', {
        body: { action: 'list' },
      });
      if (error) throw error;
      return (data?.payments ?? []) as ManualPayment[];
    },
  });
}
