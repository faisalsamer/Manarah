'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'الأزرار', href: '/ui-preview' },
  { label: 'النوافذ المنبثقة', href: '/ui-preview/dialog' },
  { label: 'نوافذ التأكيد', href: '/ui-preview/confirm-dialog' },
  { label: 'الإشعارات', href: '/ui-preview/toast' },
];

export function PreviewNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-full)] w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              'px-4 py-2 text-[var(--text-body-sm)] font-semibold rounded-[var(--radius-full)]',
              'transition-all duration-[200ms] ease-out',
              isActive
                ? 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
