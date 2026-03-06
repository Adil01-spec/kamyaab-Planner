import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PaymentInstructions } from './PaymentInstructions';
import { WhatsAppPaymentButton } from '@/components/WhatsAppPaymentButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatPKRPrice, TIER_DEFINITIONS, type ProductTier } from '@/lib/subscriptionTiers';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

type PaymentMethod = 'bank_transfer' | 'jazzcash' | 'easypaisa';

interface ManualPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTier: ProductTier;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export function ManualPaymentModal({ open, onOpenChange, selectedTier, onSuccess }: ManualPaymentModalProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tierDef = TIER_DEFINITIONS[selectedTier];
  const amount = tierDef.priceMonthlyPKR ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, or PDF allowed.', variant: 'destructive' });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Max 5MB allowed.', variant: 'destructive' });
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!user || !method) return;
    if (!transactionId.trim()) {
      toast({ title: 'Transaction ID required', variant: 'destructive' });
      return;
    }
    if (transactionId.trim().length < 4 || transactionId.trim().length > 50) {
      toast({ title: 'Invalid Transaction ID', description: 'Must be 4-50 characters.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Check daily submission limit (max 3)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('manual_payments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if ((count ?? 0) >= 3) {
        toast({ title: 'Daily limit reached', description: 'Max 3 submissions per day.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Check duplicate transaction ID
      const { count: dupCount } = await supabase
        .from('manual_payments')
        .select('id', { count: 'exact', head: true })
        .eq('transaction_id', transactionId.trim());

      if ((dupCount ?? 0) > 0) {
        toast({ title: 'Duplicate Transaction ID', description: 'This transaction ID has already been submitted.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Create payment record first to get ID
      const paymentId = crypto.randomUUID();
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (file) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${user.id}/${paymentId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          setSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('payment_proofs').getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      }

      // Insert payment record
      const { error: insertError } = await supabase
        .from('manual_payments')
        .insert({
          id: paymentId,
          user_id: user.id,
          email: user.email || '',
          plan_tier: selectedTier,
          amount,
          currency: 'PKR',
          payment_method: method,
          transaction_id: transactionId.trim(),
          screenshot_url: screenshotUrl,
          status: 'pending',
        });

      if (insertError) {
        toast({ title: 'Submission failed', description: insertError.message, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Set pending state on profile
      const pendingExpiry = new Date();
      pendingExpiry.setHours(pendingExpiry.getHours() + 48);
      await supabase
        .from('profiles')
        .update({
          pending_plan_tier: selectedTier,
          pending_expires_at: pendingExpiry.toISOString(),
        })
        .eq('id', user.id);

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setMethod(null);
    setTransactionId('');
    setNotes('');
    setFile(null);
    setPreviewUrl(null);
    setSubmitted(false);
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment Submitted!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your payment proof has been submitted for review. You'll receive confirmation within 24 hours.
            </p>
            <Button onClick={resetAndClose} className="mt-2">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Upgrade to {tierDef.name}
            <Badge variant="secondary">{formatPKRPrice(amount)}/mo</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Method selection */}
          <div className="space-y-2">
            <Label className="text-sm">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['bank_transfer', 'jazzcash', 'easypaisa'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    method === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                  }`}
                >
                  {m === 'bank_transfer' ? 'Bank Transfer' : m === 'jazzcash' ? 'JazzCash' : 'Easypaisa'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment instructions */}
          {method && <PaymentInstructions method={method} />}

          {/* Transaction ID */}
          <div className="space-y-1.5">
            <Label htmlFor="txn-id" className="text-sm">Transaction ID</Label>
            <Input
              id="txn-id"
              placeholder="Enter your transaction/reference ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Screenshot upload */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment Screenshot</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/50 bg-muted/20 p-6 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-32 rounded-md object-contain" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground/50" />
              )}
              <p className="text-xs text-muted-foreground">
                {file ? file.name : 'Click to upload (JPG, PNG, PDF — max 5MB)'}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {/* WhatsApp alternative */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs text-muted-foreground">Or submit proof via</span>
            <WhatsAppPaymentButton variant="ghost" size="sm" />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            disabled={!method || !transactionId.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Payment Proof'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
