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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-lg text-muted-foreground">
            Monitor and manage student fee subscriptions in real-time
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscriptions
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats.total}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              All active and inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Students
            </CardTitle>
            <UserCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Recurring income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or fee structure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as SubscriptionStatus | 'ALL')}
            >
              <SelectTrigger className="w-[180px] h-11">
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
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Fee Structure</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Billing Cycle</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">Next Billing</TableHead>
                  <TableHead className="font-semibold">Discount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No subscriptions found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'Try adjusting your search or filters' : 'Subscriptions will appear here once students enroll'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-base">
                            {subscription.student?.user.firstName} {subscription.student?.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {subscription.student?.studentNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{subscription.feeStructure?.name}</TableCell>
                      <TableCell className="font-bold text-base">
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium capitalize">
                          {subscription.billingCycle.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(subscription.startDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscription.nextBillingDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(subscription.nextBillingDate)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription.discountAmount > 0 ? (
                          <div className="text-sm">
                            <div className="font-bold text-green-600">
                              -{formatCurrency(subscription.discountAmount)}
                            </div>
                            {subscription.discountReason && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {subscription.discountReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
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
