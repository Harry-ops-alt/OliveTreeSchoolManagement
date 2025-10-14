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
    <aside className="relative border-r border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 md:hidden">
        <div>
          <p className="text-sm font-semibold text-primary">Olive Tree</p>
          <p className="text-xs text-muted-foreground">School Management</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-foreground transition-all hover:bg-muted/50"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border/50 bg-card/95 backdrop-blur-xl shadow-elevated transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo - Desktop - Linear Style */}
        <div className="hidden border-b border-border/50 px-4 py-4 md:block">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-soft">
              <span className="text-sm font-bold text-primary-foreground">OT</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Olive Tree</p>
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
      className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-primary/10 text-primary shadow-soft'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {/* Active Indicator - Left Border */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={2} />
      <span className="flex-1 tracking-tight">{item.label}</span>
      
      {/* Hover Arrow - Subtle */}
      <ChevronRight className={`h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-60 group-hover:translate-x-0.5 ${isActive ? 'opacity-0' : ''}`} strokeWidth={2} />
    </Link>
  );
}
