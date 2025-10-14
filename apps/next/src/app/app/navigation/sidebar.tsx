'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';
import { navigationGroups, type NavItem, type Role } from './config';

interface SidebarNavProps {
  role: Role;
  displayName: string;
  displayRole: string;
  email: string;
}

export function SidebarNav({ role, displayName, displayRole, email }: SidebarNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const groups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          label: group.label,
          items: group.items.filter((item) => item.roles.includes(role)),
        }))
        .filter((group) => group.items.length > 0),
    [role],
  );

  const userLabel = displayName || email;

  return (
    <aside className="relative border-r border-border bg-[hsl(var(--sidebar))]">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
        <div>
          <p className="text-sm font-semibold text-primary">Olive Tree</p>
          <p className="text-xs text-muted-foreground">School Management</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-foreground transition-all hover:bg-[hsl(var(--sidebar-hover))]"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-[hsl(var(--sidebar))] shadow-lg transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo - Desktop - Analytics Hub Style */}
        <div className="hidden border-b border-border px-5 py-5 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <span className="text-base font-bold text-white">OT</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Olive Tree</p>
              <p className="text-xs text-muted-foreground">School Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {groups.map((group) => (
              <nav key={group.label} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink item={item} pathname={pathname} onNavigate={close} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* User Info - Desktop */}
        <div className="hidden border-t border-border px-6 py-4 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {userLabel.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{userLabel}</p>
              <p className="truncate text-xs text-muted-foreground">{displayRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          role="presentation"
          onClick={close}
        />
      )}
    </aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}

function NavLink({ item, pathname, onNavigate }: NavLinkProps) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
          : 'text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}
