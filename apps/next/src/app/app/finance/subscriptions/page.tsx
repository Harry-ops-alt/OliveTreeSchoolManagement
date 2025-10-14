'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { listSubscriptions } from '@/lib/api/billing';
import type { Subscription, SubscriptionStatus } from '@/lib/types/billing';

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await listSubscriptions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setSubscriptions(response.items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.student?.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.student?.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.feeStructure?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants: Record<SubscriptionStatus, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Active' },
      PAUSED: { variant: 'secondary', label: 'Paused' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      COMPLETED: { variant: 'secondary', label: 'Completed' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'ACTIVE').length,
    totalRevenue: subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage student fee subscriptions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Subscriptions</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Revenue</div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SubscriptionStatus | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Fee Structure</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {subscription.student?.user.firstName} {subscription.student?.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.student?.studentNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{subscription.feeStructure?.name}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(subscription.amount)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {subscription.billingCycle.toLowerCase()}
                  </TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>
                    {subscription.nextBillingDate ? (
                      formatDate(subscription.nextBillingDate)
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {subscription.discountAmount > 0 ? (
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          -{formatCurrency(subscription.discountAmount)}
                        </div>
                        {subscription.discountReason && (
                          <div className="text-muted-foreground">
                            {subscription.discountReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
