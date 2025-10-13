import Link from 'next/link';
import { DollarSign, FileText, CreditCard, Receipt } from 'lucide-react';
import { apiFetch } from '../../../lib/api-client';

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
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Finance</p>
          <h1 className="text-3xl font-semibold text-white">Finance & Billing</h1>
          <p className="text-sm text-emerald-100/70">
            Manage fee structures, subscriptions, invoices, and payments
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {financeModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 transition-all hover:border-emerald-400/60 hover:bg-emerald-900/80"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-800/60 p-3">
                    <Icon className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-emerald-100">
                      {module.name}
                    </h3>
                    <p className="mt-1 text-sm text-emerald-100/70">{module.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <header className="space-y-2 pt-8">
          <h2 className="text-2xl font-semibold text-white">Recent Transactions</h2>
          <p className="text-sm text-emerald-100/70">
            Monitor invoices, payments, refunds, and expenses
          </p>
        </header>

        {loadFailed ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 text-sm text-emerald-100/70">
            Unable to load finance data right now. Please try again shortly.
          </div>
        ) : null}

        {hasTransactions ? (
          <ul className="space-y-4" data-testid="finance-detail-list">
            {transactions.map((transaction) => {
              const occurredDisplay = dateFormatter.format(new Date(transaction.occurredAt));
              return (
                <li
                  key={transaction.id}
                  className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6"
                  data-testid="finance-detail-item"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{toTitle(transaction.type)}</p>
                      <p className="text-sm text-emerald-200/80">{transaction.branchName}</p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-200">
                      {currencyFormatter.format(parseFloat(transaction.amount ?? '0'))}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wide text-emerald-100/60">
                    Logged {occurredDisplay}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : !loadFailed ? (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
            No finance transactions have been recorded yet. Seed the database to populate this view.
          </div>
        ) : null}
      </div>
    </div>
  );
}
