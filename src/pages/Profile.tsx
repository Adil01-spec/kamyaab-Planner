import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getTierDisplayName, formatPKRPrice, TIER_DEFINITIONS } from '@/lib/subscriptionTiers';
import { Footer } from '@/components/Footer';
import { EditProfileModal } from '@/components/EditProfileModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Crown, User, LogOut, ExternalLink, Calendar, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const subscription = useSubscription();
  const [editOpen, setEditOpen] = useState(false);

  const userInitials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const tierDef = TIER_DEFINITIONS[subscription.tier];
  const tierBadgeVariant = subscription.tier === 'standard' ? 'secondary' as const : 'default' as const;

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

            {subscription.daysRemaining !== null && subscription.daysRemaining <= 30 && (
              <p className="text-xs text-muted-foreground">
                {subscription.daysRemaining} days remaining
              </p>
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
