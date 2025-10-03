'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
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
    <aside className="relative border-r border-emerald-800/60 bg-emerald-950/90 text-emerald-50">
      <div className="flex items-center justify-between border-b border-emerald-800/60 px-5 py-4 md:hidden">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300/80">Olive Tree</p>
          <p className="text-xs text-emerald-100/60">School Management</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg border border-emerald-700/60 p-2 text-emerald-100 transition hover:border-emerald-500 hover:text-white"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-emerald-800/60 bg-emerald-950/95 px-4 py-6 shadow-xl transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:flex md:w-72 md:flex-col`}
      >
        <div className="hidden md:block">
          <p className="text-sm uppercase tracking-wide text-emerald-300/80">Olive Tree</p>
          <p className="text-xs text-emerald-100/60">School Management</p>
        </div>

        <div className="mt-6 space-y-6 overflow-y-auto pb-24 md:pb-6">
          {groups.map((group) => (
            <nav key={group.label} className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-emerald-300/70">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} pathname={pathname} onNavigate={close} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-auto hidden border-t border-emerald-800/60 pt-4 md:block">
          <p className="text-sm font-medium text-white">{userLabel}</p>
          <p className="text-xs text-emerald-200/70">{displayRole}</p>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
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
      className={`flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition ${
        isActive
          ? 'border-emerald-500/40 bg-emerald-900/80 text-white shadow-inner shadow-emerald-500/20'
          : 'text-emerald-100/80 hover:border-emerald-600/30 hover:bg-emerald-900/40 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}
