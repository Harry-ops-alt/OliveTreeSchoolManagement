'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, Users, TrendingUp, Filter, UserCheck } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage student fee subscriptions in real-time
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscriptions
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All active and inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Students
            </CardTitle>
            <div className="rounded-full bg-chart-3/10 p-2">
              <UserCheck className="h-4 w-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-chart-3">{stats.active}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <div className="rounded-full bg-chart-4/10 p-2">
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Recurring income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or fee structure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as SubscriptionStatus | 'ALL')}
            >
              <SelectTrigger className="h-10 w-[160px] border-border bg-background">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">All Subscriptions</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fee Structure</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing Cycle</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Date</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Billing</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-5 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <div className="rounded-full bg-muted/50 p-3">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No subscriptions found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Subscriptions will appear here once students enroll'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="group border-b border-border transition-colors hover:bg-muted/30">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            {subscription.student?.user.firstName} {subscription.student?.user.lastName}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {subscription.student?.studentNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">{subscription.feeStructure?.name}</TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-sm text-foreground">
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="secondary" className="bg-secondary/50 font-medium text-xs capitalize">
                          {subscription.billingCycle.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">{formatDate(subscription.startDate)}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                        {subscription.nextBillingDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(subscription.nextBillingDate)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {subscription.discountAmount > 0 ? (
                          <div className="text-sm">
                            <div className="font-semibold text-chart-3">
                              -{formatCurrency(subscription.discountAmount)}
                            </div>
                            {subscription.discountReason && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {subscription.discountReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">{getStatusBadge(subscription.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
