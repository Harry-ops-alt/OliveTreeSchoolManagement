import Link from 'next/link';
import { DollarSign, FileText, CreditCard, Receipt } from 'lucide-react';
import { apiFetch } from '../../../lib/api-client';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

type FinanceItem = {
  id: string;
  type: string;
  amount: string;
  occurredAt: string;
  branchName: string;
};

async function getFinance(): Promise<FinanceItem[]> {
  const response = await apiFetch('/dashboard/finance/recent');

  if (!response.ok) {
    throw new Error(`Finance request failed (${response.status})`);
  }

  return (await response.json()) as FinanceItem[];
}

const financeModules = [
  {
    name: 'Fee Structures',
    description: 'Manage tuition fees and billing cycles',
    href: '/app/finance/fee-structures',
    icon: DollarSign,
  },
  {
    name: 'Subscriptions',
    description: 'Student fee subscriptions and enrollments',
    href: '/app/finance/subscriptions',
    icon: Receipt,
  },
  {
    name: 'Invoices & Payments',
    description: 'Track invoices and record payments',
    href: '/app/finance/invoices',
    icon: FileText,
  },
];

function toTitle(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default async function FinancePage() {
  let transactions: FinanceItem[] = [];
  let loadFailed = false;

  try {
    transactions = await getFinance();
  } catch (error) {
    console.error('Failed to load finance transactions', error);
    loadFailed = true;
  }

  const hasTransactions = transactions.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Billing"
        description="Manage fee structures, subscriptions, invoices, and payments"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {financeModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="group border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                        {module.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor invoices, payments, refunds, and expenses
          </p>
        </div>

        {loadFailed ? (
          <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardContent className="p-6">
              <p className="text-sm text-gray-900 dark:text-white">
                Unable to load finance data right now. Please try again shortly.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {hasTransactions ? (
          <div className="space-y-4" data-testid="finance-detail-list">
            {transactions.map((transaction) => {
              const occurredDisplay = dateFormatter.format(new Date(transaction.occurredAt));
              return (
                <Card
                  key={transaction.id}
                  className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
                  data-testid="finance-detail-item"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{toTitle(transaction.type)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.branchName}</p>
                      </div>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {currencyFormatter.format(parseFloat(transaction.amount ?? '0'))}
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Logged {occurredDisplay}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : !loadFailed ? (
          <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-10 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No finance transactions have been recorded yet. Seed the database to populate this view.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
