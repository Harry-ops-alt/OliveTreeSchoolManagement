import Link from 'next/link';

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
    <div className="px-6 py-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Settings & Administration</h1>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          Configure organizational settings, manage permissions, and connect operational systems that power Olive
          Tree Schools.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-6 transition hover:border-emerald-500/50 hover:bg-emerald-900/50"
          >
            <h2 className="text-lg font-semibold text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-emerald-100/70">{card.description}</p>
            <span className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wide text-emerald-300/80 group-hover:text-emerald-200">
              Manage
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
