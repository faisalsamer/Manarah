import type { ReactNode } from 'react';
import { PreviewNav } from './_components/PreviewNav';

export default function UIPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <main className="px-8 py-10 max-w-[1200px] mx-auto">
      <header className="mb-8">
        <h1 className="text-[var(--text-h1)] font-bold text-[var(--color-text-primary)]">
          مكتبة المكونات
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mt-2 mb-5">
          معرض لجميع مكونات الواجهة في نظام التصميم
        </p>
        <PreviewNav />
      </header>
      {children}
    </main>
  );
}
