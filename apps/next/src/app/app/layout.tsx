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
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <SidebarNav
            role={role}
            displayName={displayName}
            displayRole={displayRole}
            email={session.email}
          />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Olive Tree</p>
                  <p className="text-sm font-medium text-muted-foreground">School Management Platform</p>
                </div>
                <div className="flex items-center gap-3">
                  <ApiHealthIndicator />
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-foreground">{displayName || session.email}</p>
                    <p className="text-xs text-muted-foreground">{displayRole}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
                    {(displayName || session.email).slice(0, 2).toUpperCase()}
                  </div>
                  <form action={logout}>
                    <Button type="submit" variant="ghost" className="h-9 font-medium hover:bg-muted">
                      Log out
                    </Button>
                  </form>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-muted/30 p-6 lg:p-8">
              <ComingSoonBoundary>{children}</ComingSoonBoundary>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
