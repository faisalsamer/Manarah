'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Building2, Receipt, PiggyBank, HandCoins, Landmark } from 'lucide-react';
import { Money } from '@/components/ui/RiyalSign';
import type { CurrentUser } from '@/lib/user';

interface LinkedBankSummary {
  total_balance: number;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'الصفحة الرئيسية',     href: '/advisor' },
  { icon: Building2,       label: 'البنوك',              href: '/banking' },
  { icon: Receipt,         label: 'المصاريف والنفقات',   href: '/expenses' },
  { icon: PiggyBank,       label: 'المدخرات',            href: '/marasi' },
  { icon: HandCoins,       label: 'الزاكاة',            href: '/zakat' },

];

export interface SidebarProps {
  user: CurrentUser;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initial = user.name.trim().charAt(0) || '?';

  const [totalBalance, setTotalBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/banks/linked/linked')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return;
        const sum = Array.isArray(data)
          ? (data as LinkedBankSummary[]).reduce((acc, b) => acc + (b.total_balance ?? 0), 0)
          : 0;
        setTotalBalance(sum);
      })
      .catch(() => {
        if (!cancelled) setTotalBalance(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="fixed top-0 right-0 w-(--sidebar-width) h-screen flex flex-col z-sidebar overflow-hidden bg-linear-to-b from-sidebar-bg to-sidebar-bg-deep">
      {/* Logo */}
      <div className="pt-5 px-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9.5 h-9.5 rounded-[10px] bg-primary-400 flex items-center justify-center shrink-0">
            <Landmark size={20} color="white" />
          </div>
          <div>
            <div className="text-[17px] font-bold text-white leading-[1.1]">منارة</div>
            <div className="text-[10px] text-primary-400 tracking-[0.5px]">MANARAH FINANCE</div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.07] mx-4 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 py-2 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'relative flex items-center gap-3 px-3.5 py-2.5 rounded-md text-body-sm font-medium transition-colors duration-150 ' +
                (isActive
                  ? 'bg-sidebar-active-bg text-primary-400'
                  : 'text-sidebar-text-muted hover:bg-white/4 hover:text-sidebar-text')
              }
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-1.5 bottom-1.5 w-0.75 rounded-full bg-sidebar-active-border"
                />
              )}
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Balance Panel */}
      <div className="mt-auto mx-3 mb-3 p-4 rounded-md bg-white/6 border border-white/10">
        <div className="text-micro text-sidebar-text-muted mb-1.5">الرصيد الإجمالي</div>
        <div className="text-[22px] font-bold text-text-inverse">
          {totalBalance === null ? (
            <span className="text-sidebar-text-muted">—</span>
          ) : (
            <Money amount={totalBalance} />
          )}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-white/[0.07]">
        <div className="w-8.5 h-8.5 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-body-lg font-bold text-white shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-semibold text-white truncate">{user.name}</div>
          <div className="text-micro text-sidebar-text-muted truncate">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}
