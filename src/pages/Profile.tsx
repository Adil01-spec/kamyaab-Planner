import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getTierDisplayName, formatPKRPrice, TIER_DEFINITIONS, type ProductTier } from '@/lib/subscriptionTiers';
import { Footer } from '@/components/Footer';
import { EditProfileModal } from '@/components/EditProfileModal';
import { DeferredProfileCard } from '@/components/DeferredProfileCard';
import { ManualPaymentModal } from '@/components/payments/ManualPaymentModal';
import { PendingPaymentBanner } from '@/components/payments/PendingPaymentBanner';
import { RenewalBanner } from '@/components/RenewalBanner';
import { WhatsAppPaymentButton } from '@/components/WhatsAppPaymentButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, Crown, User, LogOut, ExternalLink, Calendar, Pencil, CalendarDays, Bell, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { type PreferredCalendar, savePreferredCalendar, fetchPreferredCalendar, CALENDAR_LABELS } from '@/utils/calendarRouter';
import { toast } from 'sonner';

const REMINDER_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
];

const CALENDAR_OPTIONS: { value: PreferredCalendar; label: string }[] = [
  { value: 'kamyaab', label: 'Kamyaab Calendar' },
  { value: 'google', label: 'Google Calendar' },
  { value: 'apple', label: 'Apple Calendar' },
];

const getDefaultReminder = () => {
  try { return localStorage.getItem('default_reminder_minutes') || '15'; } catch { return '15'; }
};
const setDefaultReminder = (v: string) => {
  try { localStorage.setItem('default_reminder_minutes', v); } catch {}
};
const getNotificationsEnabled = () => {
  try { return localStorage.getItem('notification_enabled') !== 'false'; } catch { return true; }
};
const setNotificationsEnabled = (v: boolean) => {
  try { localStorage.setItem('notification_enabled', v ? 'true' : 'false'); } catch {}
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const subscription = useSubscription();
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<ProductTier>('pro');
  // Calendar settings state
  const [calendarPref, setCalendarPref] = useState<PreferredCalendar>('kamyaab');
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  // Load calendar preference from DB on mount
  useState(() => {
    if (user?.id) {
      fetchPreferredCalendar(user.id).then(pref => {
        setCalendarPref(pref);
        setCalendarLoaded(true);
      });
    }
  });
  const [reminderTime, setReminderTime] = useState(getDefaultReminder());
  const [notificationsOn, setNotificationsOn] = useState(getNotificationsEnabled());

  const userInitials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const tierDef = TIER_DEFINITIONS[subscription.tier];
  const tierBadgeVariant = subscription.tier === 'standard' ? 'secondary' as const : 'default' as const;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        </div>

        {/* Profile Info */}
        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground truncate">{profile?.fullName || 'User'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {profile?.profession && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground/60 shrink-0" />
                  <div>
                    <p className="text-muted-foreground/60 text-xs">Profession</p>
                    <p className="text-foreground/90">{profile.profession}</p>
                  </div>
                </div>
              )}
              {user?.created_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground/60 shrink-0" />
                  <div>
                    <p className="text-muted-foreground/60 text-xs">Member since</p>
                    <p className="text-foreground/90">{format(new Date(user.created_at), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <EditProfileModal open={editOpen} onOpenChange={setEditOpen} />
        <ManualPaymentModal 
          open={paymentOpen} 
          onOpenChange={setPaymentOpen} 
          selectedTier={selectedUpgradeTier} 
        />

        {/* Deferred Profile Completion */}
        <DeferredProfileCard />

        {/* Renewal Banner */}
        <RenewalBanner />

        {/* Current Plan */}
        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{getTierDisplayName(subscription.tier)}</span>
                  <Badge variant={tierBadgeVariant} className="text-xs">
                    {subscription.state === 'active' ? 'Active' : subscription.state}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{tierDef.tagline}</p>
              </div>
              <p className="text-sm font-medium text-foreground/80">
                {formatPKRPrice(tierDef.priceMonthlyPKR)}{tierDef.priceMonthlyPKR ? '/mo' : ''}
              </p>
            </div>

            {subscription.warning.type && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{subscription.warning.message}</p>
              </div>
            )}

            <PendingPaymentBanner />

            {subscription.daysRemaining !== null && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{subscription.daysRemaining} days remaining</span>
                {subscription.isPaid && subscription.daysRemaining <= 30 && (
                  <span className="text-foreground/70">
                    Expires: {subscription.daysRemaining > 0 
                      ? `in ${subscription.daysRemaining} days` 
                      : 'Expired'}
                  </span>
                )}
              </div>
            )}

            {/* Upgrade options for non-business tiers */}
            {subscription.tier !== 'business' && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Upgrade Plan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['student', 'pro', 'business'] as const)
                    .filter(t => {
                      const tiers = ['standard', 'student', 'pro', 'business'];
                      return tiers.indexOf(t) > tiers.indexOf(subscription.tier);
                    })
                    .map(t => (
                      <button
                        key={t}
                        onClick={() => { setSelectedUpgradeTier(t); setPaymentOpen(true); }}
                        className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 text-foreground"
                      >
                        <span className="block">{TIER_DEFINITIONS[t].name}</span>
                        <span className="block text-muted-foreground text-[10px] mt-0.5">
                          {formatPKRPrice(TIER_DEFINITIONS[t].priceMonthlyPKR)}
                        </span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => navigate('/pricing')}
            >
              View Plans & Pricing
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Settings */}
        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Calendar Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Default Calendar</Label>
              <Select
                value={calendarPref}
                onValueChange={async (v) => {
                  const target = v as PreferredCalendar;
                  setCalendarPref(target);
                  try {
                    if (user?.id) await savePreferredCalendar(user.id, target);
                    toast.success('Calendar preference saved');
                  } catch {
                    toast.error('Failed to save preference');
                  }
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Default Reminder</Label>
              <Select
                value={reminderTime}
                onValueChange={(v) => {
                  setReminderTime(v);
                  setDefaultReminder(v);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive task reminders</p>
              </div>
              <Switch
                checked={notificationsOn}
                onCheckedChange={(v) => {
                  setNotificationsOn(v);
                  setNotificationsEnabled(v);
                }}
              />
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Bell className="w-4 h-4 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-muted-foreground/60 text-xs">Timezone</p>
                <p className="text-foreground/90">{timezone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-muted-foreground/60 text-xs">Email</p>
              <p className="text-foreground/90">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => navigate('/contact')}
            >
              Need help? Contact support →
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
