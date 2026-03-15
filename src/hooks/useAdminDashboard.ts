import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminProfile {
  id: string;
  full_name: string | null;
  profession: string | null;
  created_at: string;
  subscription_tier: string | null;
  subscription_state: string | null;
  subscription_expires_at: string | null;
  pending_plan_tier: string | null;
  avatar_url: string | null;
  email: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan_tier: string;
  status: string;
  start_date: string;
  end_date: string;
  grace_end: string | null;
  billing_cycle: string;
  payment_source: string | null;
  created_at: string | null;
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'dashboard' },
      });
      if (error) throw error;
      return data as {
        profiles: AdminProfile[];
        subscriptions: AdminSubscription[];
        payments: any[];
        emailMap: Record<string, string>;
      };
    },
    staleTime: 30_000,
  });
}

export function useAdminAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, any>) => {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-manual-payments'] });
    },
  });
}
