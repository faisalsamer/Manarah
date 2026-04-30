'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Receipt, PiggyBank, HandCoins, Landmark } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'الصفحة الرئيسية',     href: '/advisor' },
  { icon: Building2,       label: 'البنوك',              href: '/dashboard' },
  { icon: Receipt,         label: 'المصاريف والنفقات',   href: '/expenses' },
  { icon: PiggyBank,       label: 'المدخرات',            href: '/payments' },
  { icon: HandCoins,       label: 'الزكاة',              href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 right-0 w-(--sidebar-width) h-screen flex flex-col z-sidebar overflow-hidden bg-linear-to-b from-sidebar-bg to-sidebar-bg-deep">
      {/* Logo */}
      <div className="pt-5 px-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9.5 h-9.5 rounded-[10px] bg-primary-400 flex items-center justify-center shrink-0">
            <Landmark size={20} color="white" />
          </div>
          <div>
            <div className="text-[17px] font-bold text-white leading-[1.1]">منار</div>
            <div className="text-[10px] text-primary-400 tracking-[0.5px]">MANAR FINANCE</div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.07] mx-4 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 py-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'flex items-center gap-3 mx-2 px-4 py-3 rounded-sm text-body-sm font-medium transition-all duration-150 ' +
                (isActive
                  ? 'bg-sidebar-active-bg text-primary-400 border-r-[3px] border-sidebar-active-border'
                  : 'text-sidebar-text-muted hover:bg-white/6 hover:text-sidebar-text')
              }
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Balance Panel */}
      <div className="mt-auto mx-3 mb-3 p-4 rounded-md bg-white/6 border border-white/10">
        <div className="text-micro text-sidebar-text-muted mb-1.5">الرصيد الإجمالي</div>
        <div className="text-[22px] font-bold text-text-inverse text-right [direction:ltr]">42,800 ر.س</div>
        <div className="text-caption text-primary-400 mt-1">↑ 2.4% هذا الشهر</div>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-white/[0.07]">
        <div className="w-8.5 h-8.5 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-body-lg font-bold text-white shrink-0">
          أ
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-semibold text-white truncate">أحمد الفارسي</div>
          <div className="text-micro text-sidebar-text-muted">CUST001</div>
        </div>
      </div>
    </aside>
  );
}
