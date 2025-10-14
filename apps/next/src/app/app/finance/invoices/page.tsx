'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, CreditCard, FileText, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
    const variants: Record<InvoiceStatus, { variant: any; label: string; className?: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft', className: 'text-xs' },
      ISSUED: { variant: 'default', label: 'Issued', className: 'bg-primary text-xs hover:bg-primary/90' },
      PAID: { variant: 'default', label: 'Paid', className: 'bg-chart-3 text-xs hover:bg-chart-3/90' },
      PARTIALLY_PAID: { variant: 'default', label: 'Partial', className: 'bg-chart-4 text-xs hover:bg-chart-4/90' },
      OVERDUE: { variant: 'destructive', label: 'Overdue', className: 'text-xs' },
      CANCELLED: { variant: 'secondary', label: 'Cancelled', className: 'text-xs' },
    };
    const { variant, label, className } = variants[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoices & Payments</h1>
          <p className="text-sm text-muted-foreground">
            Track invoices, record payments, and monitor outstanding balances
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Invoices
            </CardTitle>
            <div className="rounded-full bg-chart-3/10 p-2">
              <CheckCircle className="h-4 w-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-chart-3">{stats.paid}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Fully settled
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4 bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <div className="rounded-full bg-chart-4/10 p-2">
              <DollarSign className="h-4 w-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalAmount - stats.paidAmount)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Pending collection
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
                placeholder="Search by invoice number or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'ALL')}
            >
              <SelectTrigger className="h-10 w-[160px] border-border bg-background">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">All Invoices</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice #</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue Date</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Date</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 px-6 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-4"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="ml-auto h-8 w-10" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <div className="rounded-full bg-muted/50 p-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No invoices found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Invoices will appear here once generated'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group border-b border-border transition-colors hover:bg-muted/30">
                      <TableCell className="px-6 py-4 font-semibold text-sm text-foreground">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="font-semibold text-sm text-foreground">
                          {invoice.student?.user.firstName} {invoice.student?.user.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-sm text-foreground">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-sm text-chart-3">{formatCurrency(invoice.paidAmount)}</TableCell>
                      <TableCell className="px-4 py-4">{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPaymentDialog(invoice)}
                              className="h-8 w-8 p-0 hover:bg-chart-3/10 hover:text-chart-3"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
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
        </CardContent>
      </Card>

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
