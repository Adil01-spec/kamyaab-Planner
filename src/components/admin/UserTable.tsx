import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { AdminProfile } from '@/hooks/useAdminDashboard';

interface Props {
  profiles: AdminProfile[];
}

export default function UserTable({ profiles }: Props) {
  if (!profiles.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No users found.</p>;
  }

  const tierBadge = (tier: string | null, state: string | null) => {
    if (!tier || tier === 'standard') return <Badge variant="outline">Free</Badge>;
    const active = state === 'active';
    return (
      <Badge className={active ? 'bg-primary/20 text-primary border-0' : ''} variant={active ? 'default' : 'secondary'}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map(p => (
            <TableRow key={p.id}>
              <TableCell className="text-sm">{p.full_name || '—'}</TableCell>
              <TableCell className="text-xs">{p.email}</TableCell>
              <TableCell className="text-xs">{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell>{tierBadge(p.subscription_tier, p.subscription_state)}</TableCell>
              <TableCell>
                {p.pending_plan_tier ? (
                  <Badge variant="secondary">Pending: {p.pending_plan_tier}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{p.subscription_state || 'active'}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
