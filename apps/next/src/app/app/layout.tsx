export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../components/toast/toast-provider';
import { ApiHealthIndicator } from '../../components/system/api-health-indicator';
import { ComingSoonBoundary } from '../../components/feature-flags/coming-soon';
import type { Role } from './navigation/config';
import { SidebarNav } from './navigation/sidebar';
import { getSession } from '../../lib/session';
import { logout } from '../../lib/auth';
import { Button } from '@olive/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect(
      '/login?error=' +
        encodeURIComponent('Your session has expired. Please sign in again to continue.'),
    );
  }

  const role = session.role as Role;
  const displayName = `${session.firstName} ${session.lastName}`.trim();
  const displayRole = session.role.replace(/_/g, ' ').toLowerCase();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-emerald-950 text-emerald-50">
        <div className="flex min-h-screen">
          <SidebarNav
            role={role}
            displayName={displayName}
            displayRole={displayRole}
            email={session.email}
          />
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-emerald-800/60 bg-emerald-950/80 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-300/80">Olive Tree</p>
                <p className="text-sm font-medium text-white">School Management Platform</p>
              </div>
              <div className="flex items-center gap-3">
                <ApiHealthIndicator />
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-white">{displayName || session.email}</p>
                  <p className="text-xs uppercase tracking-wide text-emerald-200/70">{displayRole}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-500/30 text-sm font-semibold uppercase text-emerald-100 flex items-center justify-center">
                  {(displayName || session.email).slice(0, 2)}
                </div>
                <form action={logout}>
                  <Button type="submit" variant="ghost" className="border border-emerald-700/60 bg-transparent text-emerald-100 hover:bg-emerald-800/40">
                    Log out
                  </Button>
                </form>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-emerald-950/90">
              <ComingSoonBoundary>{children}</ComingSoonBoundary>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
