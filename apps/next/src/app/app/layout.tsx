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
      <div className="dark min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <SidebarNav
            role={role}
            displayName={displayName}
            displayRole={displayRole}
            email={session.email}
          />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-8 py-4 backdrop-blur-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Olive Tree</p>
                <p className="text-sm font-medium text-foreground">School Management Platform</p>
              </div>
              <div className="flex items-center gap-4">
                <ApiHealthIndicator />
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-foreground">{displayName || session.email}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{displayRole}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold uppercase text-primary ring-2 ring-primary/30">
                  {(displayName || session.email).slice(0, 2)}
                </div>
                <form action={logout}>
                  <Button type="submit" variant="ghost" className="border border-border font-medium hover:bg-muted">
                    Log out
                  </Button>
                </form>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background p-8">
              <ComingSoonBoundary>{children}</ComingSoonBoundary>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
