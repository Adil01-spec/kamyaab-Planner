import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricsCards from '@/components/admin/MetricsCards';
import PendingPaymentsTable from '@/components/admin/PendingPaymentsTable';
import SubscriptionsTable from '@/components/admin/SubscriptionsTable';
import UserTable from '@/components/admin/UserTable';

const ADMIN_EMAILS = ['kaamyab.app@gmail.com', 'rajaadil4445@gmail.com'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useAdminDashboard();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/payments')} className="gap-1.5">
              <CreditCard className="w-4 h-4" />
              Payment Management
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            {/* Metrics */}
            <MetricsCards profiles={data.profiles} subscriptions={data.subscriptions} payments={data.payments} />

            {/* Pending Payments */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingPaymentsTable payments={data.payments} />
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-amber-500">Expiring Soon (≤ 3 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionsTable subscriptions={data.subscriptions} emailMap={data.emailMap} expiringSoonOnly />
              </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionsTable subscriptions={data.subscriptions.filter(s => s.status === 'active')} emailMap={data.emailMap} />
              </CardContent>
            </Card>

            {/* All Payments History */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingPaymentsTable payments={data.payments} showAll />
              </CardContent>
            </Card>

            {/* Users */}
            <Card className="border-border/30 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Users ({data.profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <UserTable profiles={data.profiles} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
