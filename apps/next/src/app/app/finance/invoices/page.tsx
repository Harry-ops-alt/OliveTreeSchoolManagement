'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, CreditCard, FileText } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  listInvoices,
  getInvoice,
  recordPayment,
} from '@/lib/api/billing';
import type { Invoice, InvoiceStatus, PaymentMethod } from '@/lib/types/billing';

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await listInvoices({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setInvoices(response.items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await recordPayment({
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentData.amount),
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
      });
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      setShowPaymentDialog(false);
      resetPaymentForm();
      loadInvoices();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: '',
      paymentMethod: 'BANK_TRANSFER',
      reference: '',
      notes: '',
    });
    setSelectedInvoice(null);
  };

  const openPaymentDialog = async (invoice: Invoice) => {
    try {
      const fullInvoice = await getInvoice(invoice.id);
      setSelectedInvoice(fullInvoice);
      const remaining = fullInvoice.amount - fullInvoice.paidAmount;
      setPaymentData({
        ...paymentData,
        amount: remaining.toString(),
      });
      setShowPaymentDialog(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.student?.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.student?.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants: Record<InvoiceStatus, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      ISSUED: { variant: 'default', label: 'Issued' },
      PAID: { variant: 'default', label: 'Paid' },
      PARTIALLY_PAID: { variant: 'default', label: 'Partial' },
      OVERDUE: { variant: 'destructive', label: 'Overdue' },
      CANCELLED: { variant: 'secondary', label: 'Cancelled' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'PAID').length,
    overdue: invoices.filter((i) => i.status === 'OVERDUE').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Payments</h1>
          <p className="text-muted-foreground">Manage student invoices and record payments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Invoices</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Paid</div>
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalAmount - stats.paidAmount)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    {invoice.student?.user.firstName} {invoice.student?.user.lastName}
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentDialog(invoice)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for invoice {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="grid gap-4 py-4">
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Invoice Amount</div>
                      <div className="font-medium">{formatCurrency(selectedInvoice.amount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Paid</div>
                      <div className="font-medium">{formatCurrency(selectedInvoice.paidAmount)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Remaining</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Payment Amount (£) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={paymentData.paymentMethod}
                    onValueChange={(value) =>
                      setPaymentData({ ...paymentData, paymentMethod: value as PaymentMethod })
                    }
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CARD_MANUAL">Card (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="e.g., TRF-20250113-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  resetPaymentForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
