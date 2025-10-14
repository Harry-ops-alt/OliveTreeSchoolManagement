import Link from 'next/link';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent } from '../../../components/ui/card';

const cards: Array<{
  title: string;
  description: string;
  href: string;
}> = [
  {
    title: 'Branches & Rooms',
    description:
      'Manage campus locations, contact information, and classroom capacity to support scheduling and reporting.',
    href: '/app/settings/branches',
  },
];

export default function SettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Administration"
        description="Configure organizational settings, manage permissions, and connect operational systems that power Olive Tree Schools."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="group h-full border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                  Manage →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
