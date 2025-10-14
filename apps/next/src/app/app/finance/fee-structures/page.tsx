'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Archive } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structures</h1>
          <p className="text-muted-foreground">Manage tuition fees and billing cycles</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fee structures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Year Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No fee structures found
                </TableCell>
              </TableRow>
            ) : (
              filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{fee.name}</div>
                      {fee.description && (
                        <div className="text-sm text-muted-foreground">{fee.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(fee.amount)}</TableCell>
                  <TableCell>{getBillingCycleLabel(fee.billingCycle)}</TableCell>
                  <TableCell>{fee.yearGroup || '-'}</TableCell>
                  <TableCell>
                    {fee.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(fee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(fee.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
