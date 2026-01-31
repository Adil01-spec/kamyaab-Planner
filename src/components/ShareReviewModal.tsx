import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Link2, Trash2, Loader2, RefreshCw, Briefcase, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  generateShareToken,
  getShareUrl,
  getExpiryDate,
  formatExpiryDate,
  getDaysUntilExpiry,
  isShareExpired,
} from '@/lib/shareReview';
import { cn } from '@/lib/utils';

interface SharedReview {
  id: string;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

interface ShareReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planData: any;
}

export function ShareReviewModal({
  open,
  onOpenChange,
  planId,
  planData,
}: ShareReviewModalProps) {
  const { user } = useAuth();
  const [shares, setShares] = useState<SharedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState<'7' | '14' | '30'>('14');
  const [linkType, setLinkType] = useState<'review' | 'advisor'>('advisor');
  const [copied, setCopied] = useState(false);

  // Fetch existing shares
  useEffect(() => {
    if (!open || !user) return;

    const fetchShares = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shared_reviews')
          .select('id, token, expires_at, revoked, created_at')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setShares((data as SharedReview[]) || []);
      } catch (error) {
        console.error('Error fetching shares:', error);
        toast({
          title: 'Error',
          description: 'Failed to load share links.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShares();
  }, [open, planId, user]);

  // Generate new share link
  const handleGenerateLink = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const token = generateShareToken();
      const expiresAt = getExpiryDate(parseInt(expiryDays) as 7 | 14 | 30);

      // Prepare snapshot with planning style profile if available
      const snapshot = {
        ...planData,
        // Include planning style profile if it exists in the user's profile
        planning_style_profile: planData.planning_style_profile || null,
      };

      const { data, error } = await supabase
        .from('shared_reviews')
        .insert({
          user_id: user.id,
          plan_id: planId,
          token,
          expires_at: expiresAt.toISOString(),
          plan_snapshot: snapshot,
        })
        .select('id, token, expires_at, revoked, created_at')
        .single();

      if (error) throw error;

      setShares(prev => [data as SharedReview, ...prev]);
      
      // Copy to clipboard with selected link type
      const url = getShareUrl(token, linkType);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: 'Link created and copied!',
        description: `${linkType === 'advisor' ? 'Advisor' : 'Standard'} link expires in ${expiryDays} days`,
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share link.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Revoke a share link (invalidates both link types)
  const handleRevoke = async (shareId: string) => {
    setRevoking(shareId);
    try {
      const { error } = await supabase
        .from('shared_reviews')
        .update({ revoked: true })
        .eq('id', shareId);

      if (error) throw error;

      setShares(prev =>
        prev.map(s => (s.id === shareId ? { ...s, revoked: true } : s))
      );

      toast({
        title: 'Link revoked',
        description: 'Both advisor and standard links are now invalid.',
      });
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke link.',
        variant: 'destructive',
      });
    } finally {
      setRevoking(null);
    }
  };

  // Copy link to clipboard
  const handleCopy = async (token: string, type: 'review' | 'advisor') => {
    const url = getShareUrl(token, type);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copied',
      description: `${type === 'advisor' ? 'Advisor' : 'Standard'} link copied to clipboard.`,
    });
  };

  // Get active (non-revoked, non-expired) shares
  const activeShares = shares.filter(s => !s.revoked && !isShareExpired(s.expires_at));
  const expiredOrRevokedShares = shares.filter(s => s.revoked || isShareExpired(s.expires_at));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Share for Review
          </DialogTitle>
          <DialogDescription>
            Create read-only links to share your plan with advisors or colleagues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Link Type Selection */}
          <div className="space-y-3">
            <Label>Link Type</Label>
            <Tabs value={linkType} onValueChange={(v) => setLinkType(v as 'review' | 'advisor')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="advisor" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Advisor View
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Standard View
                </TabsTrigger>
              </TabsList>
              <TabsContent value="advisor" className="text-sm text-muted-foreground mt-2">
                Professional view with strategy, insights, and planning style. Ideal for mentors and managers.
              </TabsContent>
              <TabsContent value="review" className="text-sm text-muted-foreground mt-2">
                Basic view with plan structure and feedback form. Good for peer review.
              </TabsContent>
            </Tabs>
          </div>

          {/* Expiry Selection */}
          <div className="space-y-3">
            <Label>Link Expiry</Label>
            <div className="flex items-center gap-3">
              <RadioGroup
                value={expiryDays}
                onValueChange={(v) => setExpiryDays(v as '7' | '14' | '30')}
                className="flex gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="7days" />
                  <Label htmlFor="7days" className="text-sm font-normal cursor-pointer">
                    7 days
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="14" id="14days" />
                  <Label htmlFor="14days" className="text-sm font-normal cursor-pointer">
                    14 days
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="30days" />
                  <Label htmlFor="30days" className="text-sm font-normal cursor-pointer">
                    30 days
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateLink}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate {linkType === 'advisor' ? 'Advisor' : 'Standard'} Link
              </>
            )}
          </Button>

          {/* Active links */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeShares.length > 0 ? (
            <div className="space-y-3">
              <Label>Active Links</Label>
              {activeShares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 rounded-lg bg-muted/50 border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {getDaysUntilExpiry(share.expires_at)}d left
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(share.id)}
                      disabled={revoking === share.id}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      {revoking === share.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(share.token, 'advisor')}
                      className="flex-1 text-xs"
                    >
                      <Briefcase className="w-3 h-3 mr-1" />
                      Advisor
                      {copied && <Check className="w-3 h-3 ml-1 text-primary" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(share.token, 'review')}
                      className="flex-1 text-xs"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Standard
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Expired/Revoked links */}
          {expiredOrRevokedShares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Expired / Revoked</Label>
              {expiredOrRevokedShares.slice(0, 3).map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground text-xs"
                >
                  <span className="truncate flex-1">
                    ...{share.token.slice(-8)}
                  </span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    share.revoked ? "border-destructive/50 text-destructive" : "border-muted"
                  )}>
                    {share.revoked ? 'Revoked' : 'Expired'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Privacy info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• No personal identifiers are exposed to viewers</p>
            <p>• Links are not indexed by search engines</p>
            <p>• Revoking a link invalidates both view types</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
