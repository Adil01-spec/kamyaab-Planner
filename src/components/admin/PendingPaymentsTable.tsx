import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import type { ManualPayment } from '@/hooks/useManualPayments';

interface Props {
  payments: ManualPayment[];
  showAll?: boolean;
}

export default function PendingPaymentsTable({ payments, showAll }: Props) {
  const queryClient = useQueryClient();
  const filtered = showAll ? payments : payments.filter(p => p.status === 'pending');

  const [actionPayment, setActionPayment] = useState<ManualPayment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const handleAction = async () => {
    if (!actionPayment || !actionType) return;
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('approve-manual-payment', {
        body: { action: actionType, payment_id: actionPayment.id, notes: adminNotes },
      });
      if (error) throw error;
      toast({ title: `Payment ${actionType}d successfully` });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-manual-payments'] });
      setActionPayment(null);
      setActionType(null);
      setAdminNotes('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-primary/20 text-primary border-0">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No payments to show.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Txn ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.email}</TableCell>
                <TableCell className="capitalize">{p.plan_tier}</TableCell>
                <TableCell>PKR {p.amount}</TableCell>
                <TableCell className="text-xs">{p.payment_method.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs font-mono">{p.transaction_id || '—'}</TableCell>
                <TableCell>{statusBadge(p.status)}</TableCell>
                <TableCell className="text-xs">{format(new Date(p.created_at), 'MMM d, HH:mm')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {p.screenshot_url && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setScreenshotUrl(p.screenshot_url)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {p.status === 'pending' && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => { setActionPayment(p); setActionType('approve'); }}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { setActionPayment(p); setActionType('reject'); }}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!actionPayment && !!actionType} onOpenChange={() => { setActionPayment(null); setActionType(null); setAdminNotes(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve' : 'Reject'} Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {actionPayment?.email} — {actionPayment?.plan_tier} (PKR {actionPayment?.amount})
            </p>
            <Textarea placeholder="Admin notes..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} />
            <Button onClick={handleAction} disabled={processing} className="w-full" variant={actionType === 'reject' ? 'destructive' : 'default'}>
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionType === 'approve' ? 'Approve & Activate' : 'Reject Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!screenshotUrl} onOpenChange={() => setScreenshotUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
          {screenshotUrl && <img src={screenshotUrl} alt="Payment proof" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
