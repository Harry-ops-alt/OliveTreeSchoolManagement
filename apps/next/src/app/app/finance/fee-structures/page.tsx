'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Archive, DollarSign, Calendar, TrendingUp, Filter } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  listFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
} from '@/lib/api/billing';
import type { FeeStructure, BillingCycle } from '@/lib/types/billing';

export default function FeeStructuresPage() {
  const { toast } = useToast();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    billingCycle: 'MONTHLY' as BillingCycle,
    yearGroup: '',
    organizationId: 'olive-tree-schools', // From session in real app
  });

  useEffect(() => {
    loadFeeStructures();
  }, []);

  const loadFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await listFeeStructures({ active: 'true' });
      setFeeStructures(response.items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load fee structures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFee) {
        await updateFeeStructure(editingFee.id, {
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          billingCycle: formData.billingCycle,
          yearGroup: formData.yearGroup || null,
        });
        toast({ title: 'Success', description: 'Fee structure updated' });
      } else {
        await createFeeStructure({
          ...formData,
          amount: parseFloat(formData.amount),
          yearGroup: formData.yearGroup || null,
        });
        toast({ title: 'Success', description: 'Fee structure created' });
      }
      setShowDialog(false);
      resetForm();
      loadFeeStructures();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save fee structure',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this fee structure?')) return;
    try {
      await archiveFeeStructure(id);
      toast({ title: 'Success', description: 'Fee structure archived' });
      loadFeeStructures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive fee structure',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      billingCycle: 'MONTHLY',
      yearGroup: '',
      organizationId: 'olive-tree-schools',
    });
    setEditingFee(null);
  };

  const openEditDialog = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      description: fee.description || '',
      amount: fee.amount.toString(),
      billingCycle: fee.billingCycle,
      yearGroup: fee.yearGroup || '',
      organizationId: fee.organizationId,
    });
    setShowDialog(true);
  };

  const filteredFees = feeStructures.filter((fee) =>
    fee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getBillingCycleLabel = (cycle: BillingCycle) => {
    const labels: Record<BillingCycle, string> = {
      MONTHLY: 'Monthly',
      TERMLY: 'Termly',
      QUARTERLY: 'Quarterly',
      ANNUAL: 'Annual',
      ONE_TIME: 'One-time',
    };
    return labels[cycle];
  };

  const stats = {
    total: feeStructures.length,
    active: feeStructures.filter((f) => f.active).length,
    avgAmount: feeStructures.length > 0 
      ? feeStructures.reduce((sum, f) => sum + f.amount, 0) / feeStructures.length 
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fee Structures</h1>
          <p className="text-sm text-muted-foreground">
            Manage tuition fees and billing cycles across your organization
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fee Structures
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Across all billing cycles
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Fees
            </CardTitle>
            <div className="rounded-full bg-chart-3/10 p-2">
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-chart-3">{stats.active}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Fee
            </CardTitle>
            <div className="rounded-full bg-chart-4/10 p-2">
              <Calendar className="h-4 w-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgAmount)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Per billing cycle
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
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">All Fee Structures</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                {filteredFees.length} {filteredFees.length === 1 ? 'fee structure' : 'fee structures'} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing Cycle</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Year Group</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 px-6 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <div className="rounded-full bg-muted/50 p-3">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No fee structures found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first fee structure'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFees.map((fee) => (
                    <TableRow key={fee.id} className="group border-b border-border transition-colors hover:bg-muted/30">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-sm text-foreground">{fee.name}</div>
                          {fee.description && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{fee.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-sm text-foreground">{formatCurrency(fee.amount)}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="secondary" className="bg-secondary/50 font-medium text-xs">
                          {getBillingCycleLabel(fee.billingCycle)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">{fee.yearGroup || '-'}</TableCell>
                      <TableCell className="px-4 py-4">
                        {fee.active ? (
                          <Badge className="bg-chart-3 text-xs font-medium hover:bg-chart-3/90">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(fee)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(fee.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingFee ? 'Edit' : 'Create'} Fee Structure</DialogTitle>
              <DialogDescription>
                {editingFee ? 'Update the fee structure details' : 'Add a new fee structure'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (£) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle *</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) =>
                      setFormData({ ...formData, billingCycle: value as BillingCycle })
                    }
                  >
                    <SelectTrigger id="billingCycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="TERMLY">Termly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearGroup">Year Group (optional)</Label>
                <Input
                  id="yearGroup"
                  value={formData.yearGroup}
                  onChange={(e) => setFormData({ ...formData, yearGroup: e.target.value })}
                  placeholder="e.g., Year 6"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingFee ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
